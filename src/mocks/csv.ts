import type { Asset, ToggleYesNo } from '../types/domain';

// 단순 CSV 파서: 따옴표 미사용 가정. 우리 샘플 데이터는 콤마/따옴표를 필드 내에 포함하지 않음.
// 다중 IP는 '|'로 구분.

function parseToggle(v: string): ToggleYesNo | null {
  const s = v.trim().toLowerCase();
  if (s === 'yes' || s === 'no') return s as ToggleYesNo;
  return null;
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
      antivirus: parseToggle(r.antivirus || ''),
      edr: parseToggle(r.edr || ''),
      owner: hasOwner
        ? {
            name: r.owner_name,
            email: r.owner_email,
            dept: r.owner_dept,
          }
        : null,
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
