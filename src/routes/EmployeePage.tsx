import { useEffect, useRef, useState } from 'react';
import { Home as HomeIcon, Info } from 'lucide-react';
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

// 한 번에 불러올 자산 개수. 실 운영 환경(10만+)에서는 20~50 권장.
// 현재 샘플 데이터(21건)에서 무한 스크롤 동작을 확인할 수 있도록 12로 설정.
const PAGE_SIZE = 12;

export default function EmployeePage() {
  const [mode, setMode] = useState<SearchMode>('all');
  const [query, setQuery] = useState('');
  const [isDefaultQuery, setIsDefaultQuery] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  // 마지막으로 "확정 검색"에 사용된 mode/query — 페이지 추가 호출 시 동일 조건 유지
  const lastSearchRef = useRef<{ mode: SearchMode; q: string } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [showHomeBtn, setShowHomeBtn] = useState(false);

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
    setHasMore(false);
    setNextPage(0);
    lastSearchRef.current = null;
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
    setItems([]);
    lastSearchRef.current = { mode, q: query };
    const r = await searchAssets(mode, query, 0, PAGE_SIZE);
    setItems(r.items);
    setTotal(r.total);
    setHasMore(r.hasMore);
    setNextPage(1);
    setLoading(false);
    if (r.total === 0) {
      show('검색 결과가 없습니다. 새 자산을 등록해 주세요.', 'info');
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || loading || !lastSearchRef.current) return;
    setLoadingMore(true);
    const { mode: m, q } = lastSearchRef.current;
    const r = await searchAssets(m, q, nextPage, PAGE_SIZE);
    setItems((prev) => [...prev, ...r.items]);
    setHasMore(r.hasMore);
    setNextPage((p) => p + 1);
    setLoadingMore(false);
  };

  // 무한 스크롤: 결과 영역 끝에 다다르면 다음 페이지 로드
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // hasMore가 false→true로 바뀔 때 또는 sentinel 재마운트 시 다시 attach
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, items.length]);

  // 우측 하단 Home(맨 위로) 버튼: 일정 스크롤 이상에서만 표시
  useEffect(() => {
    const onScroll = () => setShowHomeBtn(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    if (!searched || !lastSearchRef.current) return;
    const { mode: m, q } = lastSearchRef.current;
    const r = await searchAssets(m, q, 0, PAGE_SIZE);
    setItems(r.items);
    setTotal(r.total);
    setHasMore(r.hasMore);
    setNextPage(1);
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
              setHasMore(false);
              setNextPage(0);
              setIsDefaultQuery(false);
              lastSearchRef.current = null;
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
          loadingMore={loadingMore}
          hasMore={hasMore}
          sentinelRef={sentinelRef}
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

      <button
        type="button"
        aria-label="맨 위로"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-30 grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow-lg transition-all duration-200 hover:bg-brand-2 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
          showHomeBtn ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-3'
        }`}
      >
        <HomeIcon className="h-5 w-5" />
      </button>
    </Shell>
  );
}
