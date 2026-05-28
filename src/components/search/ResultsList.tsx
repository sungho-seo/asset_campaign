import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Search as SearchIcon } from 'lucide-react';
import type { Asset } from '../../types/domain';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatDateTime } from '../../lib/format';

type ResultsListProps = {
  loading: boolean;
  searched: boolean;
  query: string;
  items: Asset[];
  total: number;
  currentUserName: string;
  onSelect: (asset: Asset) => void;
  onNew: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  sentinelRef?: Ref<HTMLDivElement>;
};

export function ResultsList({
  loading,
  searched,
  query,
  items,
  total,
  currentUserName,
  onSelect,
  onNew,
  loadingMore = false,
  hasMore = false,
  sentinelRef,
}: ResultsListProps) {
  const { t } = useTranslation();

  if (!searched) {
    return (
      <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-line bg-white py-16 text-center">
        <SearchIcon className="h-6 w-6 text-text-4" />
        <div className="text-[13px] text-text-3">
          {t('employee.emptyState.noQuery')}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-line bg-white py-16 text-center text-[13px] text-text-3">
        {t('common.searching')}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-white py-12 text-center">
        <SearchIcon className="h-7 w-7 text-text-4" />
        <div>
          <div className="text-sm font-medium text-text">
            {t('employee.emptyState.noResults')}
          </div>
          <div className="mt-1 text-[12.5px] text-text-3">
            {t('employee.emptyState.noResultsHint', { query })}
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={onNew}>
          <Plus className="h-3 w-3" /> {t('employee.registerNew')}
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line bg-bg-soft/50 px-4 py-2.5">
        <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
          {t('employee.totals.searchResults', { count: total })}
        </div>
        <Button variant="ghost" size="sm" onClick={onNew}>
          <Plus className="h-3 w-3" /> {t('employee.resultsTable.newAssetShort')}
        </Button>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-line text-left font-mono text-[10.5px] uppercase tracking-wider text-text-3">
            <th className="px-4 py-2.5 font-medium">{t('employee.columns.hostname')}</th>
            <th className="px-4 py-2.5 font-medium">{t('employee.columns.ip')}</th>
            <th className="px-4 py-2.5 font-medium">{t('employee.columns.owner')}</th>
            <th className="px-4 py-2.5 font-medium">{t('employee.columns.locationOs')}</th>
            <th className="px-4 py-2.5 font-medium">{t('employee.columns.status')}</th>
            <th className="px-4 py-2.5 font-medium">{t('employee.columns.updatedAt')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => {
            const mine = a.owner?.name === currentUserName;
            return (
              <tr
                key={a.id}
                onClick={() => onSelect(a)}
                className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-bg-soft/60"
              >
                <td className="px-4 py-3">
                  <div className="font-mono text-[12.5px] font-medium text-text">
                    {a.hostname}
                  </div>
                  <div className="text-[11px] text-text-3">
                    {a.purpose || (
                      <span className="font-mono text-text-4">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-0.5">
                    {a.ips.map((ip) => (
                      <span key={ip} className="font-mono text-[12px] text-text-2">
                        {ip}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  {a.owner ? (
                    <>
                      <div className="text-[12.5px] text-text">{a.owner.name}</div>
                      <div className="text-[11px] text-text-3">{a.owner.dept}</div>
                    </>
                  ) : (
                    <span className="font-mono text-[11px] text-text-4">—</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="text-[12.5px] text-text-2">{a.location}</div>
                  <div className="font-mono text-[11px] text-text-3">{a.os}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  {mine ? (
                    <Badge variant="mine">{t('employee.status.mine')}</Badge>
                  ) : a.owner ? (
                    <Badge variant="assigned">{t('employee.status.assigned')}</Badge>
                  ) : (
                    <Badge variant="unassigned">{t('employee.status.unassigned')}</Badge>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {a.updatedAt ? (
                    <>
                      <div className="font-mono text-[11.5px] text-text-2">
                        {formatDateTime(a.updatedAt)}
                      </div>
                      <div className="text-[11px] text-text-3">{a.updatedBy}</div>
                    </>
                  ) : (
                    <span className="font-mono text-[11px] text-text-4">
                      {t('employee.status.neverUpdated')}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center gap-2 border-t border-line bg-bg-soft/30 py-4 text-[12px] text-text-3"
        >
          {loadingMore ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t('employee.totals.loadingMore')}</span>
            </>
          ) : (
            <span className="text-text-4">{t('employee.totals.scrollHint')}</span>
          )}
        </div>
      )}
      {!hasMore && items.length > 0 && total > items.length && (
        <div className="border-t border-line bg-bg-soft/30 py-3 text-center font-mono text-[11px] text-text-4">
          {t('employee.totals.partial', { shown: items.length.toLocaleString(), total: total.toLocaleString() })}
        </div>
      )}
      {!hasMore && items.length > 0 && total === items.length && total > 20 && (
        <div className="border-t border-line bg-bg-soft/30 py-3 text-center font-mono text-[11px] text-text-4">
          {t('employee.totals.complete', { total: total.toLocaleString() })}
        </div>
      )}
    </div>
  );
}
