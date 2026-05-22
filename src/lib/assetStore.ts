import type { Asset, SearchMode, SearchResult } from '../types/domain';
import { MOCK_ASSETS, MOCK_USER } from './mock';

// Phase 5에서 MSW + CSV 어댑터로 대체될 in-memory store.
// 컴포넌트는 이 모듈의 함수만 호출하므로 백엔드 전환 시 영향 범위가 좁음.

let store: Asset[] = MOCK_ASSETS.map((a) => ({ ...a, ips: [...a.ips] }));

function delay<T>(value: T, ms = 180): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

export async function getMe() {
  return delay(MOCK_USER, 60);
}

export async function searchAssets(
  mode: SearchMode,
  q: string,
  page = 0,
  pageSize = 20
): Promise<SearchResult> {
  const query = q.trim().toLowerCase();
  let items = store;

  if (query) {
    items = items.filter((a) => {
      switch (mode) {
        case 'ip':
          return a.ips.some((ip) => ip.includes(query));
        case 'hostname':
          return a.hostname.toLowerCase().includes(query);
        case 'owner':
          return a.owner?.name.toLowerCase().includes(query) ?? false;
        case 'email':
          return a.owner?.email.toLowerCase().includes(query) ?? false;
        case 'all':
        default:
          return (
            a.hostname.toLowerCase().includes(query) ||
            a.ips.some((ip) => ip.includes(query)) ||
            (a.owner?.name.toLowerCase().includes(query) ?? false) ||
            (a.owner?.email.toLowerCase().includes(query) ?? false)
          );
      }
    });
  } else if (mode === 'owner') {
    items = items.filter((a) => a.owner?.name === MOCK_USER.name);
  } else if (mode === 'email') {
    items = items.filter((a) => a.owner?.email === MOCK_USER.email);
  }

  const total = items.length;
  const start = page * pageSize;
  const slice = items.slice(start, start + pageSize);
  return delay({ total, items: slice, hasMore: total > start + pageSize });
}

export async function getAsset(id: string): Promise<Asset | null> {
  return delay(store.find((a) => a.id === id) ?? null, 80);
}

export async function checkIPConflict(
  ip: string,
  excludeId?: string
): Promise<Asset | null> {
  const found = store.find(
    (a) => a.ips.includes(ip) && a.id !== excludeId
  );
  return delay(found ?? null, 60);
}

export type SaveOptions = {
  forceOverwrite?: boolean;
  ifMatchUpdatedAt?: string | null;
};

export type ConflictError = {
  type: 'conflict';
  serverAsset: Asset;
};

export async function updateAsset(
  id: string,
  patch: Partial<Asset>,
  options: SaveOptions = {}
): Promise<Asset | ConflictError> {
  const idx = store.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error(`Asset ${id} not found`);
  const current = store[idx];

  if (
    !options.forceOverwrite &&
    options.ifMatchUpdatedAt !== undefined &&
    current.updatedAt !== options.ifMatchUpdatedAt
  ) {
    return delay({ type: 'conflict' as const, serverAsset: current });
  }

  const updated: Asset = {
    ...current,
    ...patch,
    ips: patch.ips ? [...patch.ips] : current.ips,
    owner: patch.owner ?? current.owner,
    updatedAt: new Date().toISOString(),
    updatedBy: patch.owner?.name ?? MOCK_USER.name,
  };
  store[idx] = updated;
  return delay(updated, 200);
}

export type CreateResult =
  | { type: 'ok'; asset: Asset }
  | { type: 'ip-conflict'; existing: Asset };

export async function createAsset(
  input: Omit<Asset, 'id' | 'qualysDetectedAt' | 'updatedAt' | 'updatedBy'>,
  options: SaveOptions = {}
): Promise<CreateResult> {
  if (!options.forceOverwrite) {
    for (const ip of input.ips) {
      const dup = store.find((a) => a.ips.includes(ip));
      if (dup) return delay({ type: 'ip-conflict' as const, existing: dup });
    }
  }
  const newId = `ASSET-${String(Math.floor(Math.random() * 900000) + 100000)}`;
  const now = new Date().toISOString();
  const asset: Asset = {
    ...input,
    id: newId,
    ips: [...input.ips],
    qualysDetectedAt: now,
    updatedAt: now,
    updatedBy: input.owner?.name ?? MOCK_USER.name,
  };
  store = [asset, ...store];
  return delay({ type: 'ok' as const, asset });
}

// 테스트/리셋용
export function __resetStore(items: Asset[] = MOCK_ASSETS) {
  store = items.map((a) => ({ ...a, ips: [...a.ips] }));
}

// Phase 5 — CSV에서 자산을 부트스트랩할 때 사용 예정
export function __loadFromAssets(items: Asset[]) {
  store = items.map((a) => ({ ...a, ips: [...a.ips] }));
}
