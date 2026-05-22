import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { Panel } from '../components/layout/Panel';
import { PageHeader } from '../components/layout/PageHeader';
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
import { createAsset, searchAssets, updateAsset } from '../lib/api';
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
  const [isDefaultQuery, setIsDefaultQuery] = useState(false);
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

  // 탭 변경 시 자동 채움 (담당자 / 이메일). 첫 클릭 시 지우기 위해 isDefaultQuery 플래그 사용.
  useEffect(() => {
    if (mode === 'owner') {
      setQuery(MOCK_USER.name);
      setIsDefaultQuery(true);
    } else if (mode === 'email') {
      setQuery(MOCK_USER.email);
      setIsDefaultQuery(true);
    } else {
      setQuery('');
      setIsDefaultQuery(false);
    }
    setSearched(false);
    setItems([]);
    setTotal(0);
  }, [mode]);

  // 사용자 입력이 시작되면 default 상태 해제
  const handleQueryChange = (v: string) => {
    setQuery(v);
    if (isDefaultQuery) setIsDefaultQuery(false);
  };

  // 입력창에 포커스/클릭 시, 아직 default 자동 채움 상태이면 즉시 지움
  const handleQueryFocus = () => {
    if (isDefaultQuery) {
      setQuery('');
      setIsDefaultQuery(false);
    }
  };

  const runSearch = async () => {
    setLoading(true);
    setSearched(true);
    const r = await searchAssets(mode, query);
    setItems(r.items);
    setTotal(r.total);
    setLoading(false);
    if (r.total === 0) {
      show('검색 결과가 없습니다. 새 자산을 등록해 주세요.', 'info');
    }
  };

  const openEdit = (asset: Asset) => {
    setDrawer({ kind: 'edit', asset, initial: valuesFromAsset(asset, MOCK_USER) });
  };
  const openNew = () => {
    setDrawer({ kind: 'new', initial: emptyValues(MOCK_USER) });
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
      const result = await updateAsset(asset.id, {
        owner: values.owner,
        assetType: values.assetType,
        hostname: values.hostname,
        purpose: values.purpose,
        ips: values.ips,
        internet: values.internet,
        domain: values.domain,
        os: values.os,
        osVersion: values.osVersion,
        location: values.location,
        antivirus: values.antivirus,
        edr: values.edr,
        forceOverwrite,
        ifMatchUpdatedAt: forceOverwrite ? undefined : asset.updatedAt,
      });
      if (result.type === 'conflict') {
        setConflict({ asset: result.serverAsset, pending: values });
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
      const result = await createAsset({
        assetType: values.assetType,
        hostname: values.hostname,
        purpose: values.purpose,
        ips: values.ips,
        internet: values.internet,
        domain: values.domain,
        os: values.os,
        osVersion: values.osVersion,
        location: values.location,
        antivirus: values.antivirus,
        edr: values.edr,
        owner: values.owner,
        forceOverwrite,
      });
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
      <PageHeader
        eyebrow="ASSET CAMPAIGN"
        title="IT 자산 정보를 확인해 주세요"
        subtitle="본인이 사용 중이거나 관리하는 IT 자산을 검색해 정보를 업데이트해 주세요."
      />

      <Panel title="자산 검색" subtitle="5가지 모드로 빠르게 찾기" padded={false}>
        <SearchTabs value={mode} onChange={setMode} />
        <div className="px-5 py-4">
          <SearchBox
            mode={mode}
            value={query}
            onChange={handleQueryChange}
            onSubmit={runSearch}
            onFocusInput={handleQueryFocus}
            onClear={() => {
              setSearched(false);
              setItems([]);
              setTotal(0);
              setIsDefaultQuery(false);
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
                {drawer.asset.hostname}
                {drawer.asset.domain && `.${drawer.asset.domain}`}
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
          formRef.current?.setValues(valuesFromAsset(conflict.asset, MOCK_USER));
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
          setDrawer({ kind: 'edit', asset, initial: valuesFromAsset(asset, MOCK_USER) });
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
