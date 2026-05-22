import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { Panel } from '../components/layout/Panel';
import { Banner } from '../components/feedback/Banner';
import { Button } from '../components/common/Button';
import { SearchTabs } from '../components/search/SearchTabs';
import { SearchBox } from '../components/search/SearchBox';
import { ResultsList } from '../components/search/ResultsList';
import { SideDrawer } from '../components/drawer/SideDrawer';
import {
  AssetForm,
  type AssetFormHandle,
  emptyValues,
  valuesFromAsset,
} from '../components/form/AssetForm';
import { ConflictModal } from '../components/form/ConflictModal';
import { IPDupModal } from '../components/form/IPDupModal';
import { useToast } from '../components/feedback/Toast';
import type { Asset, SearchMode } from '../types/domain';
import {
  createAsset,
  searchAssets,
  updateAsset,
  type ConflictError,
} from '../lib/assetStore';
import { MOCK_USER } from '../lib/mock';
import type { AssetFormValues } from '../lib/validation';
import { formatDateTime } from '../lib/format';

type DrawerState =
  | { kind: 'closed' }
  | { kind: 'edit'; asset: Asset; initial: AssetFormValues }
  | { kind: 'new'; initial: AssetFormValues };

export default function EmployeePage() {
  const [mode, setMode] = useState<SearchMode>('all');
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);

  const [drawer, setDrawer] = useState<DrawerState>({ kind: 'closed' });
  const [saving, setSaving] = useState(false);
  const formRef = useRef<AssetFormHandle>(null);

  const [conflict, setConflict] = useState<{ asset: Asset; pending: AssetFormValues } | null>(
    null
  );
  const [ipDup, setIpDup] = useState<{ existing: Asset; pending: AssetFormValues } | null>(
    null
  );

  const { show } = useToast();

  // 탭 변경 시 자동 채움 (담당자 / 이메일)
  useEffect(() => {
    if (mode === 'owner') setQuery(MOCK_USER.name);
    else if (mode === 'email') setQuery(MOCK_USER.email);
    else if (mode === 'ip' || mode === 'hostname' || mode === 'all') setQuery('');
    setSearched(false);
    setItems([]);
    setTotal(0);
  }, [mode]);

  const runSearch = async () => {
    setLoading(true);
    setSearched(true);
    const r = await searchAssets(mode, query);
    setItems(r.items);
    setTotal(r.total);
    setLoading(false);
  };

  const openEdit = (asset: Asset) => {
    setDrawer({ kind: 'edit', asset, initial: valuesFromAsset(asset) });
  };
  const openNew = () => {
    setDrawer({ kind: 'new', initial: emptyValues() });
  };
  const closeDrawer = () => {
    setDrawer({ kind: 'closed' });
    setConflict(null);
    setIpDup(null);
  };

  const refreshAfterSave = async () => {
    if (!searched) return;
    const r = await searchAssets(mode, query);
    setItems(r.items);
    setTotal(r.total);
  };

  const persistEdit = async (
    asset: Asset,
    values: AssetFormValues,
    forceOverwrite = false
  ) => {
    setSaving(true);
    try {
      const result = await updateAsset(
        asset.id,
        {
          owner: values.owner,
          hostname: values.hostname,
          domain: values.domain,
          ips: values.ips,
          os: values.os,
          osVersion: values.osVersion,
          location: values.location,
          internet: values.internet,
          antivirus: values.antivirus,
          edr: values.edr,
        },
        {
          forceOverwrite,
          ifMatchUpdatedAt: forceOverwrite ? undefined : asset.updatedAt,
        }
      );
      if ((result as ConflictError).type === 'conflict') {
        setConflict({
          asset: (result as ConflictError).serverAsset,
          pending: values,
        });
        return;
      }
      await refreshAfterSave();
      show('수정 사항이 저장되었습니다', 'success');
      setTimeout(closeDrawer, 250);
    } finally {
      setSaving(false);
    }
  };

  const persistNew = async (values: AssetFormValues, forceOverwrite = false) => {
    setSaving(true);
    try {
      const result = await createAsset(
        {
          hostname: values.hostname,
          domain: values.domain,
          ips: values.ips,
          os: values.os,
          osVersion: values.osVersion,
          location: values.location,
          internet: values.internet,
          antivirus: values.antivirus,
          edr: values.edr,
          owner: values.owner,
        },
        { forceOverwrite }
      );
      if (result.type === 'ip-conflict') {
        setIpDup({ existing: result.existing, pending: values });
        return;
      }
      await refreshAfterSave();
      show('신규 자산이 등록되었습니다', 'success');
      setTimeout(closeDrawer, 250);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const values = formRef.current?.validateAndGet();
    if (!values) {
      show('입력값을 확인해 주세요', 'error');
      return;
    }
    if (drawer.kind === 'edit') await persistEdit(drawer.asset, values);
    else if (drawer.kind === 'new') await persistNew(values);
  };

  return (
    <Shell>
      <div className="mb-5">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-text-3">
          ASSET CAMPAIGN
        </div>
        <h1 className="text-2xl font-semibold tracking-tighter2">
          IT 자산 정보를 확인해 주세요
        </h1>
        <p className="mt-1 text-sm text-text-3">
          본인이 사용 중이거나 관리하는 IT 자산을 검색해 정보를 업데이트해 주세요.
        </p>
      </div>

      <Banner tone="info" className="mb-5">
        Qualys로 식별된 전체 자산 <strong>12,847건</strong> 중 약 90%가 담당자 미지정
        상태입니다. 검색 결과가 없다면 신규 등록을 진행해 주세요.
      </Banner>

      <Panel title="자산 검색" subtitle="5가지 모드로 빠르게 찾기" padded={false}>
        <SearchTabs value={mode} onChange={setMode} />
        <div className="px-5 py-4">
          <SearchBox
            mode={mode}
            value={query}
            onChange={setQuery}
            onSubmit={runSearch}
            onClear={() => {
              setSearched(false);
              setItems([]);
              setTotal(0);
            }}
          />
        </div>
      </Panel>

      <div className="mt-5">
        <ResultsList
          loading={loading}
          searched={searched}
          query={query}
          items={items}
          total={total}
          currentUserName={MOCK_USER.name}
          onSelect={openEdit}
          onNew={openNew}
        />
      </div>

      <SideDrawer
        open={drawer.kind !== 'closed'}
        onClose={closeDrawer}
        width={720}
        ariaLabel={drawer.kind === 'edit' ? '자산 편집' : '신규 자산 등록'}
        header={
          drawer.kind === 'edit' ? (
            <>
              <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
                자산 편집
              </div>
              <h2 className="text-base font-semibold tracking-tightish">
                {drawer.asset.hostname}.{drawer.asset.domain}
              </h2>
              <div className="mt-0.5 text-[12.5px] text-text-3">
                {drawer.asset.id}
                {drawer.asset.updatedAt && (
                  <>
                    {' · 마지막 수정 '}
                    {formatDateTime(drawer.asset.updatedAt)} ({drawer.asset.updatedBy})
                  </>
                )}
              </div>
            </>
          ) : drawer.kind === 'new' ? (
            <>
              <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
                신규 등록
              </div>
              <h2 className="text-base font-semibold tracking-tightish">
                자산을 새로 추가합니다
              </h2>
              <div className="mt-0.5 text-[12.5px] text-text-3">
                <Info className="mr-1 inline h-3 w-3" />
                노란 배경의 항목은 입력 전 상태입니다.
              </div>
            </>
          ) : null
        }
        footer={
          drawer.kind !== 'closed' && (
            <>
              <Button onClick={closeDrawer} disabled={saving}>
                취소
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중…' : drawer.kind === 'edit' ? '저장' : '등록'}
              </Button>
            </>
          )
        }
      >
        {drawer.kind !== 'closed' && (
          <div className="px-6 py-5">
            <AssetForm
              ref={formRef}
              mode={drawer.kind === 'new' ? 'new' : 'edit'}
              initial={drawer.initial}
              currentUser={MOCK_USER}
            />
          </div>
        )}
      </SideDrawer>

      <ConflictModal
        open={!!conflict}
        serverAsset={conflict?.asset ?? null}
        onClose={() => setConflict(null)}
        onOverwrite={async () => {
          if (!conflict || drawer.kind !== 'edit') return;
          setConflict(null);
          await persistEdit(drawer.asset, conflict.pending, true);
        }}
        onAdoptServer={() => {
          if (!conflict) return;
          formRef.current?.setValues(valuesFromAsset(conflict.asset));
          setConflict(null);
          show('상대 입력을 가져왔습니다', 'info');
        }}
      />

      <IPDupModal
        open={!!ipDup}
        existing={ipDup?.existing ?? null}
        onClose={() => setIpDup(null)}
        onEditExisting={() => {
          if (!ipDup) return;
          const asset = ipDup.existing;
          setIpDup(null);
          setDrawer({ kind: 'edit', asset, initial: valuesFromAsset(asset) });
        }}
        onOverwrite={async () => {
          if (!ipDup || drawer.kind !== 'new') return;
          const pending = ipDup.pending;
          setIpDup(null);
          await persistNew(pending, true);
        }}
      />
    </Shell>
  );
}
