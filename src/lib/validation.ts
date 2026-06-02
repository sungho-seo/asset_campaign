import { z } from 'zod';
import {
  ASSET_TYPE_VALUES,
  DATA_CLASS_VALUES,
  ENVIRONMENT_VALUES,
  OWNER_ROLE_VALUES,
  SECURITY_VALUES,
} from '../types/domain';

export function isValidIPv4(v: string): boolean {
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)) return false;
  return v.split('.').every((o) => {
    const n = Number.parseInt(o, 10);
    if (Number.isNaN(n) || n < 0 || n > 255) return false;
    if (o.length > 1 && o.startsWith('0')) return false;
    return String(n) === o;
  });
}

export function isValidDomain(v: string): boolean {
  if (/[\s,]/.test(v)) return false;
  if (!/^[a-zA-Z0-9.-]+$/.test(v)) return false;
  if (v.startsWith('.') || v.endsWith('.') || v.includes('..')) return false;
  const parts = v.split('.');
  if (parts.length < 2) return false;
  if (parts.some((p) => !p || p.startsWith('-') || p.endsWith('-'))) return false;
  if (parts[parts.length - 1].length < 2) return false;
  return true;
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

// Zod 메시지에는 i18n 키만 저장하고, UI 렌더링 시 t()로 번역.
// 사용자가 언어 토글 시 schema를 재생성하지 않아도 메시지가 따라 바뀜.
// 역할은 선택 입력 — 빈 문자열은 허용, 값이 있으면 정해진 코드 목록에서만 허용.
const ALLOWED_OWNER_ROLE = new Set<string>([...OWNER_ROLE_VALUES, '']);
const ownerRoleSchema = z.string().refine((v) => ALLOWED_OWNER_ROLE.has(v), {
  message: 'validation.owner.role',
});

export const ownerSchema = z.object({
  name: z.string().min(1, 'validation.owner.name'),
  email: z.string().refine(isValidEmail, 'validation.owner.emailFormat'),
  dept: z.string().min(1, 'validation.owner.dept'),
  role: ownerRoleSchema,
});

const toggleYesNoNullable = z.union([z.literal('yes'), z.literal('no'), z.null()]);

// 보안 솔루션: PRD v5 §5.1 (EPP/EDR/CWPP/없음) + 미입력('') 허용
const ALLOWED_SECURITY = new Set<string>([...SECURITY_VALUES, '']);
const securitySchema = z.string().refine((v) => ALLOWED_SECURITY.has(v), {
  message: 'validation.security',
});

const cloudSchema = z.object({
  csp: z.string(),
  accountId: z.string(),
  environment: z.string(),
  dataClass: z.string(),
});

export const assetFormSchema = z
  .object({
    owner: ownerSchema,
    // 추가 담당자 최대 4명 — primary 포함 5명 한도. 역할 5종과 1:1 매칭.
    additionalOwners: z.array(ownerSchema).max(4, 'validation.owner.maxOwners'),
    assetType: z.string(),
    hostname: z
      .string()
      .min(1, 'validation.hostname.required')
      .refine((v) => !/\s/.test(v), 'validation.hostname.noSpace'),
    purpose: z.string(),
    ips: z
      .array(z.string().refine(isValidIPv4, 'validation.ip.format'))
      .min(1, 'validation.ip.min'),
    domain: z
      .string()
      .refine((v) => !v || isValidDomain(v), 'validation.domain'),
    os: z.string().min(1, 'validation.os'),
    osVersion: z.string().min(1, 'validation.osVersion'),
    location: z.string(),
    internet: toggleYesNoNullable,
    security: securitySchema,
    cloud: cloudSchema,
  })
  .superRefine((data, ctx) => {
    // 자산 단위 역할 unique 검증 — primary + 추가 담당자 전부 모아서 같은 역할 중복 방지.
    // 빈 role(미선택)은 검사 대상에서 제외.
    const seen = new Map<string, number>(); // role → 처음 사용된 (-1=primary, idx=추가)
    if (data.owner.role) seen.set(data.owner.role, -1);
    data.additionalOwners.forEach((o, i) => {
      if (!o.role) return;
      if (seen.has(o.role)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['additionalOwners', i, 'role'],
          message: 'validation.owner.roleDuplicate',
        });
      } else {
        seen.set(o.role, i);
      }
    });

    // 비클라우드 자산은 IP 1개만 허용. UI에서도 입력란을 1개로 제한하지만,
    // 외부 페이로드 방어용으로 schema에도 검사 추가.
    if (data.assetType !== '클라우드' && data.ips.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ips'],
        message: 'validation.ip.singleOnly',
      });
    }

    if (data.assetType !== '클라우드') return;

    if (!data.cloud.csp.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'csp'],
        message: 'validation.cloud.csp',
      });
    }
    if (!data.cloud.accountId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'accountId'],
        message: 'validation.cloud.accountId',
      });
    }
    if (!data.cloud.environment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'environment'],
        message: 'validation.cloud.environment',
      });
    } else if (!(ENVIRONMENT_VALUES as readonly string[]).includes(data.cloud.environment)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'environment'],
        message: 'validation.cloud.environmentInvalid',
      });
    }
    if (
      data.cloud.dataClass &&
      !(DATA_CLASS_VALUES as readonly string[]).includes(data.cloud.dataClass)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'dataClass'],
        message: 'validation.cloud.dataClassInvalid',
      });
    }
  });

export type AssetFormValues = z.infer<typeof assetFormSchema>;

// assetType이 '클라우드'가 아닐 때 cloud 객체는 폼 상에서 유지되지만 제출 시 의미가 없음.
// 빈 cloud 객체 헬퍼.
export function emptyCloud(): AssetFormValues['cloud'] {
  return { csp: '', accountId: '', environment: '', dataClass: '' };
}

// 자산 유형 옵션 (재export — UI에서 import 편의)
export { ASSET_TYPE_VALUES };
