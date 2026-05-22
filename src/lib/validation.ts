import { z } from 'zod';

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
  dept: z.string().min(1, '담당자 부서 필수'),
});

export const assetFormSchema = z.object({
  owner: ownerSchema,
  hostname: z
    .string()
    .min(1, '자산명 필수')
    .refine((v) => !/\s/.test(v), '자산명 형식 확인 (공백)'),
  domain: z.string().refine(isValidDomain, '도메인 형식 확인 (예: lge.com)'),
  ips: z
    .array(z.string().refine(isValidIPv4, 'IP 형식 확인'))
    .min(1, 'IP 주소 최소 1개 입력'),
  os: z.string().min(1, '운영체제 선택'),
  osVersion: z.string().min(1, 'OS 버전 필수'),
  location: z.string().min(1, '사업장 선택'),
  internet: z.enum(['yes', 'no'], { message: '인터넷 접속 선택' }),
  antivirus: z.enum(['installed', 'not-installed', 'na'], { message: '백신 선택' }),
  edr: z.enum(['installed', 'not-installed', 'na'], { message: 'EDR 선택' }),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;
