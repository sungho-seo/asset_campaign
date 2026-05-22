import type {
  Asset,
  Owner,
  SearchMode,
  SearchResult,
} from '../types/domain';

// 개발팀이 실 백엔드로 전환할 때 이 모듈만 교체하면 됩니다.
// 모든 컴포넌트는 이 함수들만 호출합니다.

const API_BASE = '/api';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => res.statusText));
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getMe(): Promise<Owner> {
  return json(await fetch(`${API_BASE}/me`));
}

export async function searchDirectory(name: string): Promise<Owner[]> {
  const params = new URLSearchParams({ name });
  return json(await fetch(`${API_BASE}/directory/search?${params}`));
}

export async function searchAssets(
  mode: SearchMode,
  q: string,
  page = 0,
  pageSize = 20
): Promise<SearchResult> {
  const params = new URLSearchParams({
    mode,
    q,
    page: String(page),
    pageSize: String(pageSize),
  });
  return json(await fetch(`${API_BASE}/assets/search?${params}`));
}

export async function getAsset(id: string): Promise<Asset> {
  return json(await fetch(`${API_BASE}/assets/${id}`));
}

export async function checkIPConflict(ip: string, excludeId?: string) {
  const params = new URLSearchParams({ ip });
  if (excludeId) params.set('excludeId', excludeId);
  const r = await fetch(`${API_BASE}/assets/check-ip?${params}`);
  return json<{ existing: Asset | null }>(r);
}

export type UpdatePayload = Partial<Asset> & {
  ifMatchUpdatedAt?: string | null;
  forceOverwrite?: boolean;
};

export type UpdateResult =
  | { type: 'ok'; asset: Asset }
  | { type: 'conflict'; serverAsset: Asset };

export async function updateAsset(
  id: string,
  payload: UpdatePayload
): Promise<UpdateResult> {
  const res = await fetch(`${API_BASE}/assets/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    const data = (await res.json()) as { error: 'conflict'; serverAsset: Asset };
    return { type: 'conflict', serverAsset: data.serverAsset };
  }
  const asset = await json<Asset>(res);
  return { type: 'ok', asset };
}

export type CreatePayload = Omit<
  Asset,
  'id' | 'qualysDetectedAt' | 'updatedAt' | 'updatedBy'
> & { forceOverwrite?: boolean };

export type CreateResult =
  | { type: 'ok'; asset: Asset }
  | { type: 'ip-conflict'; existing: Asset };

export async function createAsset(payload: CreatePayload): Promise<CreateResult> {
  const res = await fetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    const data = (await res.json()) as { error: 'ip-conflict'; existing: Asset };
    return { type: 'ip-conflict', existing: data.existing };
  }
  const asset = await json<Asset>(res);
  return { type: 'ok', asset };
}
