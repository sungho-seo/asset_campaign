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

export const ownerSchema = z.object({
  name: z.string().min(1, '담당자 이름 필수'),
  email: z.string().refine(isValidEmail, '담당자 이메일 형식 확인'),
  dept: z.string().min(1, '소속 조직/부서 필수'),
});

const toggleYesNoNullable = z.union([z.literal('yes'), z.literal('no'), z.null()]);

// 보안 솔루션: PRD v5 §5.1 (EPP/EDR/CWPP/없음) + 미입력('') 허용
const ALLOWED_SECURITY = new Set<string>([...SECURITY_VALUES, '']);
const securitySchema = z.string().refine((v) => ALLOWED_SECURITY.has(v), {
  message: '보안 솔루션 값 확인 (EPP/EDR/CWPP/없음)',
});

// 클라우드 추가 항목 (PRD v5 §5.2). 필드 자체는 비어 있을 수 있고,
// assetType === '클라우드' 일 때만 superRefine으로 csp/accountId/environment 필수.
const cloudSchema = z.object({
  csp: z.string(),
  accountId: z.string(),
  environment: z.string(),
  dataClass: z.string(),
});

export const assetFormSchema = z
  .object({
    owner: ownerSchema,

    // 자산 정보
    assetType: z.string(),
    hostname: z
      .string()
      .min(1, '자산명 필수')
      .refine((v) => !/\s/.test(v), '자산명 형식 확인 (공백)'),
    purpose: z.string(),
    ips: z
      .array(z.string().refine(isValidIPv4, 'IP 형식 확인'))
      .min(1, 'IP 주소 최소 1개 입력'),
    domain: z
      .string()
      .refine((v) => !v || isValidDomain(v), '도메인 형식 확인 (예: lge.com)'),
    os: z.string().min(1, '운영체제 선택'),
    osVersion: z.string().min(1, '운영체제 버전 필수'),
    location: z.string(),

    // 외부 접속 여부 (선택)
    internet: toggleYesNoNullable,

    // 보안 솔루션 (선택, antivirus + edr 통합)
    security: securitySchema,

    // 클라우드 추가 항목 — assetType === '클라우드' 일 때만 superRefine에서 필수 검증
    cloud: cloudSchema,
  })
  .superRefine((data, ctx) => {
    if (data.assetType !== '클라우드') return;

    if (!data.cloud.csp.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'csp'],
        message: 'CSP 선택 필수',
      });
    }
    if (!data.cloud.accountId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'accountId'],
        message: '계정 ID 필수',
      });
    }
    if (!data.cloud.environment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'environment'],
        message: '환경 선택 필수',
      });
    } else if (!(ENVIRONMENT_VALUES as readonly string[]).includes(data.cloud.environment)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'environment'],
        message: '환경 값 확인',
      });
    }
    if (
      data.cloud.dataClass &&
      !(DATA_CLASS_VALUES as readonly string[]).includes(data.cloud.dataClass)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cloud', 'dataClass'],
        message: '취급 데이터 등급 값 확인',
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
