import type { Asset } from '../types/domain';
import { MOCK_ASSETS } from '../lib/mock';

let store: Asset[] = MOCK_ASSETS.map((a) => ({ ...a, ips: [...a.ips] }));

export function getAll(): Asset[] {
  return store;
}

export function setAll(items: Asset[]) {
  store = items.map((a) => ({ ...a, ips: [...a.ips] }));
}

export function findById(id: string): Asset | undefined {
  return store.find((a) => a.id === id);
}

export function findByIP(ip: string, excludeId?: string): Asset | undefined {
  return store.find((a) => a.ips.includes(ip) && a.id !== excludeId);
}

export function replaceById(id: string, updater: (curr: Asset) => Asset): Asset | null {
  const idx = store.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const updated = updater(store[idx]);
  store = [...store.slice(0, idx), updated, ...store.slice(idx + 1)];
  return updated;
}

export function insert(asset: Asset): Asset {
  store = [asset, ...store];
  return asset;
}

export function nextId(): string {
  return `ASSET-${String(Math.floor(Math.random() * 900000) + 100000)}`;
}
