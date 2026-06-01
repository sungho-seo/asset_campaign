import type { Asset, AssetOwner, CloudInfo, SecurityValue, ToggleYesNo } from '../types/domain';
import { OWNER_ROLE_VALUES, SECURITY_VALUES } from '../types/domain';

// 단순 CSV 파서: 따옴표 미사용 가정. 우리 샘플 데이터는 콤마/따옴표를 필드 내에 포함하지 않음.
// 다중 IP는 '|'로 구분.

function parseToggle(v: string): ToggleYesNo | null {
  const s = v.trim().toLowerCase();
  if (s === 'yes' || s === 'no') return s as ToggleYesNo;
  return null;
}

function parseSecurity(v: string): SecurityValue | '' {
  const s = v.trim();
  return (SECURITY_VALUES as readonly string[]).includes(s) ? (s as SecurityValue) : '';
}

// 역할 코드는 미리 정의된 목록에서만 허용. 알 수 없는 값은 빈 문자열로 강등.
const ROLE_SET = new Set<string>(OWNER_ROLE_VALUES);
function parseRole(v: string): string {
  const s = (v || '').trim();
  return ROLE_SET.has(s) ? s : '';
}

// additional_owners 컬럼 인코딩:
//   "name::email::dept::role|name::email::dept::role"
// 필드 4개 미만이면 무시 (관대한 파싱: 손으로 편집한 데이터 사고 흡수).
function parseAdditionalOwners(raw: string): AssetOwner[] {
  if (!raw) return [];
  const out: AssetOwner[] = [];
  for (const chunk of raw.split('|')) {
    const parts = chunk.split('::').map((s) => s.trim());
    if (parts.length < 3) continue;
    const [name, email, dept, role = ''] = parts;
    if (!name || !email || !dept) continue;
    out.push({ name, email, dept, role: parseRole(role) });
  }
  return out;
}

function parseCloud(r: Record<string, string>): CloudInfo | null {
  const csp = (r.csp || '').trim();
  const accountId = (r.cloud_accountId || '').trim();
  const environment = (r.environment || '').trim();
  const dataClass = (r.dataClass || '').trim();
  if (!csp && !accountId && !environment && !dataClass) return null;
  return {
    csp,
    accountId,
    environment: environment as CloudInfo['environment'],
    dataClass: dataClass as CloudInfo['dataClass'],
  };
}

export function parseAssetsCSV(text: string): Asset[] {
  const lines = text.replace(/\r\n/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());

  const rows: Asset[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split(',');
    const r: Record<string, string> = {};
    headers.forEach((h, idx) => {
      r[h] = (cols[idx] ?? '').trim();
    });

    const ips = (r.ips || '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    const hasOwner = !!r.owner_name && !!r.owner_email;
    rows.push({
      id: r.id,
      assetType: r.assetType || '',
      hostname: r.hostname,
      purpose: r.purpose || '',
      ips,
      internet: parseToggle(r.internet || ''),
      domain: r.domain || '',
      os: r.os,
      osVersion: r.osVersion,
      location: r.location || '',
      security: parseSecurity(r.security || ''),
      cloud: parseCloud(r),
      owner: hasOwner
        ? {
            name: r.owner_name,
            email: r.owner_email,
            dept: r.owner_dept,
            role: parseRole(r.owner_role || ''),
          }
        : null,
      additionalOwners: parseAdditionalOwners(r.additional_owners || ''),
      qualysDetectedAt: r.qualysDetectedAt,
      updatedAt: r.updatedAt || null,
      updatedBy: r.updatedBy || null,
    });
  }
  return rows;
}

export async function fetchSampleAssets(url = '/sample-assets.csv'): Promise<Asset[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV load failed: ${res.status}`);
  const text = await res.text();
  return parseAssetsCSV(text);
}
