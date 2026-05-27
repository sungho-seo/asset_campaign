import { http, HttpResponse, delay } from 'msw';
import type { Asset, Owner, SearchMode, SearchResult } from '../types/domain';
import { MOCK_DIRECTORY, MOCK_USER } from '../lib/mock';
import * as store from './store';

function matches(a: Asset, mode: SearchMode, q: string): boolean {
  if (!q) {
    if (mode === 'owner') return a.owner?.name === MOCK_USER.name;
    if (mode === 'email') return a.owner?.email === MOCK_USER.email;
    return true;
  }
  const needle = q.toLowerCase();
  switch (mode) {
    case 'ip':
      return a.ips.some((ip) => ip.includes(needle));
    case 'hostname':
      return a.hostname.toLowerCase().includes(needle);
    case 'owner':
      return a.owner?.name.toLowerCase().includes(needle) ?? false;
    case 'email':
      return a.owner?.email.toLowerCase().includes(needle) ?? false;
    case 'all':
    default:
      return (
        a.hostname.toLowerCase().includes(needle) ||
        a.ips.some((ip) => ip.includes(needle)) ||
        (a.owner?.name.toLowerCase().includes(needle) ?? false) ||
        (a.owner?.email.toLowerCase().includes(needle) ?? false)
      );
  }
}

export const handlers = [
  http.get('/api/me', async () => {
    await delay(60);
    return HttpResponse.json(MOCK_USER);
  }),

  http.get('/api/directory/search', async ({ request }) => {
    await delay(120);
    const url = new URL(request.url);
    const name = (url.searchParams.get('name') || '').trim();
    if (!name) {
      return HttpResponse.json([] as Owner[]);
    }
    const matches = MOCK_DIRECTORY.filter(
      (p) => p.name === name || p.name.includes(name)
    );
    return HttpResponse.json(matches);
  }),

  http.get('/api/assets/search', async ({ request }) => {
    await delay(180);
    const url = new URL(request.url);
    const mode = (url.searchParams.get('mode') as SearchMode) || 'all';
    const q = url.searchParams.get('q') || '';
    const page = Number(url.searchParams.get('page') || '0');
    const pageSize = Number(url.searchParams.get('pageSize') || '20');

    const filtered = store.getAll().filter((a) => matches(a, mode, q));
    const total = filtered.length;
    const start = page * pageSize;
    const items = filtered.slice(start, start + pageSize);
    const result: SearchResult = {
      total,
      items,
      hasMore: total > start + pageSize,
    };
    return HttpResponse.json(result);
  }),

  http.get('/api/assets/check-ip', async ({ request }) => {
    await delay(60);
    const url = new URL(request.url);
    const ip = url.searchParams.get('ip') || '';
    const excludeId = url.searchParams.get('excludeId') || undefined;
    const found = store.findByIP(ip, excludeId);
    return HttpResponse.json({ existing: found ?? null });
  }),

  http.get('/api/assets/:id', async ({ params }) => {
    await delay(80);
    const a = store.findById(String(params.id));
    if (!a) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(a);
  }),

  http.put('/api/assets/:id', async ({ params, request }) => {
    await delay(200);
    const id = String(params.id);
    const body = (await request.json()) as Partial<Asset> & {
      ifMatchUpdatedAt?: string | null;
      forceOverwrite?: boolean;
    };
    const current = store.findById(id);
    if (!current) return new HttpResponse(null, { status: 404 });

    if (
      !body.forceOverwrite &&
      body.ifMatchUpdatedAt !== undefined &&
      current.updatedAt !== body.ifMatchUpdatedAt
    ) {
      return HttpResponse.json(
        { error: 'conflict', serverAsset: current },
        { status: 409 }
      );
    }

    const updated = store.replaceById(id, (curr) => {
      const nextAssetType = body.assetType ?? curr.assetType;
      const nextCloud =
        nextAssetType === '클라우드'
          ? body.cloud !== undefined
            ? body.cloud
            : curr.cloud
          : null;
      return {
        ...curr,
        ...body,
        ips: body.ips ? [...body.ips] : curr.ips,
        owner: body.owner ?? curr.owner,
        cloud: nextCloud,
        updatedAt: new Date().toISOString(),
        updatedBy: body.owner?.name ?? MOCK_USER.name,
      };
    });
    return HttpResponse.json(updated);
  }),

  http.post('/api/assets', async ({ request }) => {
    await delay(220);
    const body = (await request.json()) as Omit<
      Asset,
      'id' | 'qualysDetectedAt' | 'updatedAt' | 'updatedBy'
    > & { forceOverwrite?: boolean };

    if (!body.forceOverwrite) {
      for (const ip of body.ips) {
        const dup = store.findByIP(ip);
        if (dup) {
          return HttpResponse.json(
            { error: 'ip-conflict', existing: dup },
            { status: 409 }
          );
        }
      }
    }

    const now = new Date().toISOString();
    const asset: Asset = {
      id: store.nextId(),
      assetType: body.assetType,
      hostname: body.hostname,
      purpose: body.purpose,
      ips: [...body.ips],
      internet: body.internet,
      domain: body.domain,
      os: body.os,
      osVersion: body.osVersion,
      location: body.location,
      security: body.security,
      cloud: body.assetType === '클라우드' ? body.cloud : null,
      owner: body.owner,
      qualysDetectedAt: now,
      updatedAt: now,
      updatedBy: body.owner?.name ?? MOCK_USER.name,
    };
    store.insert(asset);
    return HttpResponse.json(asset, { status: 201 });
  }),
];
