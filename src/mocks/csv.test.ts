import { describe, it, expect } from 'vitest';
import { parseAssetsCSV } from './csv';

const CSV = `id,assetType,hostname,purpose,ips,internet,domain,os,osVersion,location,owner_name,owner_email,owner_dept,security,csp,cloud_accountId,environment,dataClass,qualysDetectedAt,updatedAt,updatedBy
ASSET-001,온프레미스,host-1,개발 서버,10.0.0.1,no,lge.com,Ubuntu 22.04,22.04,서울 마곡 R&D본관 5층 501호,,,,EPP,,,,,2026-04-01T00:00:00Z,,
ASSET-002,클라우드,host-2,스테이징,10.0.0.2|10.0.0.3,yes,lge.com,RHEL 9,9.2,평택 디지털파크 B동 3층 301호,박지훈,jihoon.park@lge.com,보안운영실,CWPP,AWS,123456789012,Staging,내부용,2026-04-02T00:00:00Z,2026-05-01T10:00:00Z,박지훈
`;

describe('parseAssetsCSV', () => {
  it('헤더 + 2행을 정확히 파싱', () => {
    expect(parseAssetsCSV(CSV)).toHaveLength(2);
  });

  it('새 필드(assetType, purpose) 매핑', () => {
    const [a, b] = parseAssetsCSV(CSV);
    expect(a.assetType).toBe('온프레미스');
    expect(a.purpose).toBe('개발 서버');
    expect(b.assetType).toBe('클라우드');
    expect(b.purpose).toBe('스테이징');
  });

  it('담당자가 비어있으면 owner는 null', () => {
    const [a] = parseAssetsCSV(CSV);
    expect(a.owner).toBeNull();
    expect(a.updatedAt).toBeNull();
  });

  it('다중 IP는 "|"로 split', () => {
    const [, b] = parseAssetsCSV(CSV);
    expect(b.ips).toEqual(['10.0.0.2', '10.0.0.3']);
  });

  it('담당자가 있으면 owner 객체 구성', () => {
    const [, b] = parseAssetsCSV(CSV);
    expect(b.owner).toEqual({
      name: '박지훈',
      email: 'jihoon.park@lge.com',
      dept: '보안운영실',
      role: '',
    });
  });

  it('owner_role / additional_owners 컬럼 파싱', () => {
    const csv = `id,assetType,hostname,purpose,ips,internet,domain,os,osVersion,location,owner_name,owner_email,owner_dept,owner_role,additional_owners,security,csp,cloud_accountId,environment,dataClass,qualysDetectedAt,updatedAt,updatedBy
ASSET-R,온프레미스,h,p,10.0.0.1,no,lge.com,Ubuntu,22,loc,박지훈,jihoon.park@lge.com,보안운영실,server-primary,정유진::yujin.jung@lge.com::클라우드플랫폼팀::sm|한도윤::doyoon.han@lge.com::플랫폼인프라팀::server-backup,EDR,,,,,2026-04-01T00:00:00Z,,`;
    const [r] = parseAssetsCSV(csv);
    expect(r.owner).toEqual({
      name: '박지훈',
      email: 'jihoon.park@lge.com',
      dept: '보안운영실',
      role: 'server-primary',
    });
    expect(r.additionalOwners).toHaveLength(2);
    expect(r.additionalOwners[0]).toEqual({
      name: '정유진',
      email: 'yujin.jung@lge.com',
      dept: '클라우드플랫폼팀',
      role: 'sm',
    });
    expect(r.additionalOwners[1].role).toBe('server-backup');
  });

  it('알 수 없는 owner_role은 빈 문자열로 강등', () => {
    const csv = `id,assetType,hostname,purpose,ips,internet,domain,os,osVersion,location,owner_name,owner_email,owner_dept,owner_role,additional_owners,security,csp,cloud_accountId,environment,dataClass,qualysDetectedAt,updatedAt,updatedBy
ASSET-X,,h,p,10.0.0.1,no,lge.com,Ubuntu,22,loc,박지훈,jihoon.park@lge.com,보안운영실,bogus,,EPP,,,,,2026-04-01T00:00:00Z,,`;
    const [r] = parseAssetsCSV(csv);
    expect(r.owner?.role).toBe('');
  });

  it('additional_owners 컬럼이 없거나 비어 있으면 빈 배열', () => {
    const [a] = parseAssetsCSV(CSV);
    expect(a.additionalOwners).toEqual([]);
  });

  it('security 컬럼이 EPP/EDR/CWPP/없음으로 파싱', () => {
    const [a, b] = parseAssetsCSV(CSV);
    expect(a.security).toBe('EPP');
    expect(b.security).toBe('CWPP');
  });

  it('알 수 없는 security 값은 빈 문자열', () => {
    const csv = `id,assetType,hostname,purpose,ips,internet,domain,os,osVersion,location,owner_name,owner_email,owner_dept,security,csp,cloud_accountId,environment,dataClass,qualysDetectedAt,updatedAt,updatedBy
ASSET-X,,h,p,10.0.0.1,no,lge.com,Ubuntu,22,loc,,,,xyz,,,,,2026-04-01T00:00:00Z,,`;
    const [r] = parseAssetsCSV(csv);
    expect(r.security).toBe('');
  });

  it('internet 토글이 yes/no로 파싱', () => {
    const [a, b] = parseAssetsCSV(CSV);
    expect(a.internet).toBe('no');
    expect(b.internet).toBe('yes');
  });

  it('알 수 없는 internet 토글은 null', () => {
    const csv = `id,assetType,hostname,purpose,ips,internet,domain,os,osVersion,location,owner_name,owner_email,owner_dept,security,csp,cloud_accountId,environment,dataClass,qualysDetectedAt,updatedAt,updatedBy
ASSET-X,,h,p,10.0.0.1,maybe,lge.com,Ubuntu,22,loc,,,,,,,,,2026-04-01T00:00:00Z,,`;
    const [r] = parseAssetsCSV(csv);
    expect(r.internet).toBeNull();
  });

  it('온프레미스 행은 cloud가 null', () => {
    const [a] = parseAssetsCSV(CSV);
    expect(a.cloud).toBeNull();
  });

  it('클라우드 행은 cloud 객체 구성', () => {
    const [, b] = parseAssetsCSV(CSV);
    expect(b.cloud).toEqual({
      csp: 'AWS',
      accountId: '123456789012',
      environment: 'Staging',
      dataClass: '내부용',
    });
  });

  it('빈 줄은 무시', () => {
    expect(parseAssetsCSV(CSV + '\n\n')).toHaveLength(2);
  });

  it('헤더만 있는 경우 빈 배열', () => {
    expect(parseAssetsCSV('id,hostname\n')).toEqual([]);
  });
});
