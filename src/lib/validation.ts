import { z } from 'zod';
import {
  ASSET_TYPE_VALUES,
  DATA_CLASS_VALUES,
  ENVIRONMENT_VALUES,
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
export const ownerSchema = z.object({
  name: z.string().min(1, 'validation.owner.name'),
  email: z.string().refine(isValidEmail, 'validation.owner.emailFormat'),
  dept: z.string().min(1, 'validation.owner.dept'),
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
