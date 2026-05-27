import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import type { Asset, SearchMode, SearchResult } from '../src/types/domain';
import { parseAssetsCSV } from '../src/mocks/csv';
import { MOCK_DIRECTORY, MOCK_USER } from '../src/lib/mock';
import * as store from './store';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST_DIR = resolve(ROOT, 'dist');
const CSV_PATH = resolve(ROOT, 'public/sample-assets.csv');

const PORT = Number(process.env.PORT ?? 8049);
const HOST = process.env.HOST ?? '0.0.0.0';

function bootstrapAssets() {
  try {
    const text = readFileSync(CSV_PATH, 'utf-8');
    const items = parseAssetsCSV(text);
    store.setAll(items);
    console.log(`[server] CSV에서 자산 ${items.length}건 로드 (${CSV_PATH})`);
  } catch (err) {
    console.error(`[server] CSV 로드 실패: ${CSV_PATH}`, err);
    process.exit(1);
  }
}

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

const app = express();
app.use(express.json({ limit: '1mb' }));

// 간단한 액세스 로그
app.use((req, _res, next) => {
  const t = new Date().toISOString();
  console.log(`[${t}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, assets: store.size() });
});

app.get('/api/me', (_req, res) => {
  res.json(MOCK_USER);
});

app.get('/api/directory/search', (req, res) => {
  const name = String(req.query.name ?? '').trim();
  if (!name) {
    res.json([]);
    return;
  }
  const matches = MOCK_DIRECTORY.filter(
    (p) => p.name === name || p.name.includes(name)
  );
  res.json(matches);
});

app.get('/api/assets/search', (req, res) => {
  const mode = (req.query.mode as SearchMode) || 'all';
  const q = String(req.query.q ?? '');
  const page = Number(req.query.page ?? 0);
  const pageSize = Number(req.query.pageSize ?? 20);
  const filtered = store.getAll().filter((a) => matches(a, mode, q));
  const total = filtered.length;
  const start = page * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const result: SearchResult = {
    total,
    items,
    hasMore: total > start + pageSize,
  };
  res.json(result);
});

app.get('/api/assets/check-ip', (req, res) => {
  const ip = String(req.query.ip ?? '');
  const excludeId = req.query.excludeId ? String(req.query.excludeId) : undefined;
  const existing = store.findByIP(ip, excludeId);
  res.json({ existing: existing ?? null });
});

app.get('/api/assets/:id', (req, res) => {
  const a = store.findById(req.params.id);
  if (!a) {
    res.status(404).json({ error: 'not-found' });
    return;
  }
  res.json(a);
});

app.put('/api/assets/:id', (req, res) => {
  const id = req.params.id;
  const body = req.body as Partial<Asset> & {
    ifMatchUpdatedAt?: string | null;
    forceOverwrite?: boolean;
  };
  const current = store.findById(id);
  if (!current) {
    res.status(404).json({ error: 'not-found' });
    return;
  }
  if (
    !body.forceOverwrite &&
    body.ifMatchUpdatedAt !== undefined &&
    current.updatedAt !== body.ifMatchUpdatedAt
  ) {
    res.status(409).json({ error: 'conflict', serverAsset: current });
    return;
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
  res.json(updated);
});

app.post('/api/assets', (req, res) => {
  const body = req.body as Omit<Asset, 'id' | 'qualysDetectedAt' | 'updatedAt' | 'updatedBy'> & {
    forceOverwrite?: boolean;
  };
  if (!body.forceOverwrite) {
    for (const ip of body.ips) {
      const dup = store.findByIP(ip);
      if (dup) {
        res.status(409).json({ error: 'ip-conflict', existing: dup });
        return;
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
  res.status(201).json(asset);
});

// 정적 자원 (Vite 빌드 결과)
app.use(express.static(DIST_DIR, { maxAge: '1h', index: false }));

// SPA fallback: API가 아닌 모든 GET 요청은 index.html
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(resolve(DIST_DIR, 'index.html'));
});

bootstrapAssets();
app.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT}`);
  console.log(`[server] serving ${DIST_DIR}`);
});
