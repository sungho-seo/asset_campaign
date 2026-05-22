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
    ['010.0.0.1', false],
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
    ['lge', false],
    ['.lge.com', false],
    ['lge.com.', false],
    ['lge..com', false],
    ['lge,com', false],
    ['lge com', false],
    ['-lge.com', false],
    ['lge.com-', false],
    ['lge.c', false],
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
    ['user@domain', false],
    ['user @domain.com', false],
    ['', false],
  ])('rejects %s', (v, expected) => {
    expect(isValidEmail(v)).toBe(expected);
  });
});

describe('assetFormSchema', () => {
  const valid = {
    owner: { name: '박지훈', email: 'jihoon.park@lge.com', dept: '보안운영실' },
    assetType: '온프레미스',
    hostname: 'dev-server-01',
    purpose: '개발 서버',
    ips: ['10.20.30.40'],
    internet: 'no' as const,
    domain: 'lge.com',
    os: 'Ubuntu 22.04',
    osVersion: '22.04.3 LTS',
    location: '서울 마곡 LG사이언스파크 R&D본관 5층 521호',
    antivirus: 'yes' as const,
    edr: 'yes' as const,
  };

  it('통과 - 정상 입력', () => {
    expect(assetFormSchema.safeParse(valid).success).toBe(true);
  });

  it('통과 - 선택 필드는 빈 값/null 허용', () => {
    const r = assetFormSchema.safeParse({
      ...valid,
      assetType: '',
      purpose: '',
      internet: null,
      domain: '',
      location: '',
      antivirus: null,
      edr: null,
    });
    expect(r.success).toBe(true);
  });

  it('실패 - 자산명 공백 포함', () => {
    expect(assetFormSchema.safeParse({ ...valid, hostname: 'dev server' }).success).toBe(
      false
    );
  });

  it('실패 - 자산명 비어있음', () => {
    expect(assetFormSchema.safeParse({ ...valid, hostname: '' }).success).toBe(false);
  });

  it('실패 - IP 없음', () => {
    expect(assetFormSchema.safeParse({ ...valid, ips: [] }).success).toBe(false);
  });

  it('실패 - IP 형식 오류', () => {
    expect(assetFormSchema.safeParse({ ...valid, ips: ['10.0.0.999'] }).success).toBe(
      false
    );
  });

  it('실패 - 도메인 형식 오류 (값이 있을 때만)', () => {
    expect(assetFormSchema.safeParse({ ...valid, domain: 'lge' }).success).toBe(false);
  });

  it('실패 - 이메일 형식 오류', () => {
    expect(
      assetFormSchema.safeParse({
        ...valid,
        owner: { ...valid.owner, email: 'not-an-email' },
      }).success
    ).toBe(false);
  });

  it('실패 - 운영체제 미선택', () => {
    expect(assetFormSchema.safeParse({ ...valid, os: '' }).success).toBe(false);
  });

  it('실패 - 운영체제 버전 비어있음', () => {
    expect(assetFormSchema.safeParse({ ...valid, osVersion: '' }).success).toBe(false);
  });

  it('실패 - 소속 조직/부서 비어있음', () => {
    expect(
      assetFormSchema.safeParse({
        ...valid,
        owner: { ...valid.owner, dept: '' },
      }).success
    ).toBe(false);
  });
});
