import { describe, it, expect } from 'vitest';
import {
  assetFormSchema,
  isValidDomain,
  isValidEmail,
  isValidIPv4,
} from './validation';

describe('isValidIPv4', () => {
  it.each([
    ['10.20.30.40', true],
    ['0.0.0.0', true],
    ['255.255.255.255', true],
    ['127.0.0.1', true],
  ])('accepts %s', (v, expected) => {
    expect(isValidIPv4(v)).toBe(expected);
  });

  it.each([
    ['10.20.30', false],
    ['10.20.30.40.50', false],
    ['256.0.0.0', false],
    ['10.20.30.999', false],
    ['010.0.0.1', false], // 앞자리 0 금지
    ['10.0.0.01', false],
    ['a.b.c.d', false],
    ['', false],
    [' 10.0.0.1', false],
    ['10.0.0.1 ', false],
  ])('rejects %s', (v, expected) => {
    expect(isValidIPv4(v)).toBe(expected);
  });
});

describe('isValidDomain', () => {
  it.each([
    ['lge.com', true],
    ['mail.lge.com', true],
    ['my-server.lab.lge.com', true],
    ['sub-1.example.io', true],
  ])('accepts %s', (v, expected) => {
    expect(isValidDomain(v)).toBe(expected);
  });

  it.each([
    ['lge', false], // 점 없음
    ['.lge.com', false],
    ['lge.com.', false],
    ['lge..com', false],
    ['lge,com', false],
    ['lge com', false],
    ['-lge.com', false],
    ['lge.com-', false],
    ['lge.c', false], // TLD 1글자
    ['', false],
  ])('rejects %s', (v, expected) => {
    expect(isValidDomain(v)).toBe(expected);
  });
});

describe('isValidEmail', () => {
  it.each([
    ['sangwoo.kim@lge.com', true],
    ['a@b.io', true],
    ['user+tag@example.co.kr', true],
  ])('accepts %s', (v, expected) => {
    expect(isValidEmail(v)).toBe(expected);
  });

  it.each([
    ['no-at-sign', false],
    ['user@', false],
    ['@domain.com', false],
    ['user@domain', false], // TLD 부분 없음
    ['user @domain.com', false],
    ['', false],
  ])('rejects %s', (v, expected) => {
    expect(isValidEmail(v)).toBe(expected);
  });
});

describe('assetFormSchema', () => {
  const valid = {
    owner: { name: '김상우', email: 'sangwoo.kim@lge.com', dept: '보안솔루션실' },
    hostname: 'dev-server-01',
    domain: 'lge.com',
    ips: ['10.20.30.40'],
    os: 'Ubuntu 22.04',
    osVersion: '22.04.3 LTS',
    location: '서울 마곡 LG사이언스파크',
    internet: 'no' as const,
    antivirus: 'installed' as const,
    edr: 'installed' as const,
  };

  it('통과 - 정상 입력', () => {
    expect(assetFormSchema.safeParse(valid).success).toBe(true);
  });

  it('실패 - 자산명 공백 포함', () => {
    const r = assetFormSchema.safeParse({ ...valid, hostname: 'dev server' });
    expect(r.success).toBe(false);
  });

  it('실패 - IP 없음', () => {
    const r = assetFormSchema.safeParse({ ...valid, ips: [] });
    expect(r.success).toBe(false);
  });

  it('실패 - IP 형식 오류', () => {
    const r = assetFormSchema.safeParse({ ...valid, ips: ['10.0.0.999'] });
    expect(r.success).toBe(false);
  });

  it('실패 - 도메인 형식 오류', () => {
    const r = assetFormSchema.safeParse({ ...valid, domain: 'lge' });
    expect(r.success).toBe(false);
  });

  it('실패 - 이메일 형식 오류', () => {
    const r = assetFormSchema.safeParse({
      ...valid,
      owner: { ...valid.owner, email: 'not-an-email' },
    });
    expect(r.success).toBe(false);
  });

  it('실패 - 토글 미선택', () => {
    const r = assetFormSchema.safeParse({
      ...valid,
      internet: '' as 'yes',
    });
    expect(r.success).toBe(false);
  });
});
