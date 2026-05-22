import { describe, it, expect } from 'vitest';
import { parseAssetsCSV } from './csv';

const CSV = `id,hostname,domain,ips,os,osVersion,location,internet,antivirus,edr,owner_name,owner_email,owner_dept,qualysDetectedAt,updatedAt,updatedBy
ASSET-001,host-1,lge.com,10.0.0.1,Ubuntu 22.04,22.04,서울,no,installed,installed,,,,2026-04-01T00:00:00Z,,
ASSET-002,host-2,lge.com,10.0.0.2|10.0.0.3,RHEL 9,9.2,평택,yes,installed,not-installed,김상우,sangwoo.kim@lge.com,보안솔루션실,2026-04-02T00:00:00Z,2026-05-01T10:00:00Z,김상우
`;

describe('parseAssetsCSV', () => {
  it('헤더 + 2행을 정확히 파싱한다', () => {
    const r = parseAssetsCSV(CSV);
    expect(r).toHaveLength(2);
  });

  it('담당자가 비어있으면 owner는 null', () => {
    const [a] = parseAssetsCSV(CSV);
    expect(a.id).toBe('ASSET-001');
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
      name: '김상우',
      email: 'sangwoo.kim@lge.com',
      dept: '보안솔루션실',
    });
  });

  it('빈 줄은 무시', () => {
    const withBlank = CSV + '\n\n';
    expect(parseAssetsCSV(withBlank)).toHaveLength(2);
  });

  it('헤더만 있는 경우 빈 배열', () => {
    const r = parseAssetsCSV('id,hostname\n');
    expect(r).toEqual([]);
  });
});
