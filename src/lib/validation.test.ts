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
    additionalOwners: [],
    assetType: '온프레미스',
    hostname: 'dev-server-01',
    purpose: '개발 서버',
    ips: ['10.20.30.40'],
    internet: 'no' as const,
    domain: 'lge.com',
    os: 'Ubuntu 22.04',
    osVersion: '22.04.3 LTS',
    location: '서울 마곡 LG사이언스파크 R&D본관 5층 521호',
    security: 'EPP' as const,
    cloud: { csp: '', accountId: '', environment: '', dataClass: '' },
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
      security: '',
    });
    expect(r.success).toBe(true);
  });

  describe('클라우드 자산 — 추가 항목 검증', () => {
    const cloudBase = {
      ...valid,
      assetType: '클라우드',
      cloud: {
        csp: 'AWS',
        accountId: '123456789012',
        environment: 'Production' as const,
        dataClass: '내부용' as const,
      },
    };

    it('통과 - 클라우드 필수 항목 채움', () => {
      expect(assetFormSchema.safeParse(cloudBase).success).toBe(true);
    });

    it('실패 - 클라우드인데 CSP 비어있음', () => {
      const r = assetFormSchema.safeParse({
        ...cloudBase,
        cloud: { ...cloudBase.cloud, csp: '' },
      });
      expect(r.success).toBe(false);
    });

    it('실패 - 클라우드인데 계정 ID 비어있음', () => {
      const r = assetFormSchema.safeParse({
        ...cloudBase,
        cloud: { ...cloudBase.cloud, accountId: '' },
      });
      expect(r.success).toBe(false);
    });

    it('실패 - 클라우드인데 환경 미선택', () => {
      const r = assetFormSchema.safeParse({
        ...cloudBase,
        cloud: { ...cloudBase.cloud, environment: '' },
      });
      expect(r.success).toBe(false);
    });

    it('통과 - 클라우드인데 dataClass 비어있음 (선택)', () => {
      const r = assetFormSchema.safeParse({
        ...cloudBase,
        cloud: { ...cloudBase.cloud, dataClass: '' },
      });
      expect(r.success).toBe(true);
    });

    it('통과 - 온프레미스이면 cloud 필드 값은 무시되어 통과', () => {
      const r = assetFormSchema.safeParse({
        ...valid,
        assetType: '온프레미스',
        cloud: { csp: '', accountId: '', environment: '', dataClass: '' },
      });
      expect(r.success).toBe(true);
    });

    it('통과 - CSP 직접입력 (자유 텍스트)', () => {
      const r = assetFormSchema.safeParse({
        ...cloudBase,
        cloud: { ...cloudBase.cloud, csp: 'OracleCloud' },
      });
      expect(r.success).toBe(true);
    });
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

  it('실패 - 비클라우드 자산인데 IP 여러 개', () => {
    const r = assetFormSchema.safeParse({
      ...valid,
      assetType: '온프레미스',
      ips: ['10.0.0.1', '10.0.0.2'],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path.join('.') === 'ips');
      expect(issue?.message).toBe('validation.ip.singleOnly');
    }
  });

  it('통과 - 클라우드 자산은 IP 여러 개 허용', () => {
    const r = assetFormSchema.safeParse({
      ...valid,
      assetType: '클라우드',
      ips: ['10.0.0.1', '10.0.0.2', '10.0.0.3'],
      cloud: {
        csp: 'AWS',
        accountId: '123456789012',
        environment: 'Production',
        dataClass: '내부용',
      },
    });
    expect(r.success).toBe(true);
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

  describe('추가 담당자', () => {
    it('통과 - 추가 담당자 정확히 4명 (한도)', () => {
      const r = assetFormSchema.safeParse({
        ...valid,
        additionalOwners: [
          { name: 'A', email: 'a@x.com', dept: 'D' },
          { name: 'B', email: 'b@x.com', dept: 'D' },
          { name: 'C', email: 'c@x.com', dept: 'D' },
          { name: 'D', email: 'd@x.com', dept: 'D' },
        ],
      });
      expect(r.success).toBe(true);
    });

    it('실패 - 추가 담당자 5명 (한도 초과)', () => {
      const r = assetFormSchema.safeParse({
        ...valid,
        additionalOwners: Array.from({ length: 5 }, (_, i) => ({
          name: `P${i}`,
          email: `p${i}@x.com`,
          dept: 'D',
        })),
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = r.error.issues.find(
          (i) => i.path.join('.') === 'additionalOwners'
        );
        expect(issue?.message).toBe('validation.owner.maxOwners');
      }
    });

    it('통과 - 추가 담당자 0건', () => {
      expect(
        assetFormSchema.safeParse({ ...valid, additionalOwners: [] }).success
      ).toBe(true);
    });

    it('통과 - 추가 담당자 다건', () => {
      const r = assetFormSchema.safeParse({
        ...valid,
        additionalOwners: [
          { name: '정유진', email: 'yujin.jung@lge.com', dept: '클라우드플랫폼팀' },
          { name: '한도윤', email: 'doyoon.han@lge.com', dept: '플랫폼인프라팀' },
        ],
      });
      expect(r.success).toBe(true);
    });

    it('실패 - 추가 담당자 이메일 형식 오류', () => {
      const r = assetFormSchema.safeParse({
        ...valid,
        additionalOwners: [
          { name: '정유진', email: 'invalid', dept: '클라우드플랫폼팀' },
        ],
      });
      expect(r.success).toBe(false);
    });
  });
});
