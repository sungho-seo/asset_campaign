import { Plus, Search as SearchIcon } from 'lucide-react';
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
}: ResultsListProps) {
  if (!searched) {
    return (
      <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-line bg-white py-16 text-center">
        <SearchIcon className="h-6 w-6 text-text-4" />
        <div className="text-[13px] text-text-3">
          검색어를 입력하고 Enter 또는 검색 버튼을 눌러주세요.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-line bg-white py-16 text-center text-[13px] text-text-3">
        검색 중…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-white py-12 text-center">
        <SearchIcon className="h-7 w-7 text-text-4" />
        <div>
          <div className="text-sm font-medium text-text">검색 결과가 없습니다.</div>
          <div className="mt-1 text-[12.5px] text-text-3">
            “{query}” 에 해당하는 자산을 찾을 수 없습니다. 새로 등록할까요?
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={onNew}>
          <Plus className="h-3 w-3" /> 신규 자산 등록
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line bg-bg-soft/50 px-4 py-2.5">
        <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
          검색 결과 {total.toLocaleString()}건
        </div>
        <Button variant="ghost" size="sm" onClick={onNew}>
          <Plus className="h-3 w-3" /> 신규 등록
        </Button>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-line text-left font-mono text-[10.5px] uppercase tracking-wider text-text-3">
            <th className="px-4 py-2.5 font-medium">자산명 / 도메인</th>
            <th className="px-4 py-2.5 font-medium">IP</th>
            <th className="px-4 py-2.5 font-medium">담당자</th>
            <th className="px-4 py-2.5 font-medium">위치 / OS</th>
            <th className="px-4 py-2.5 font-medium">상태</th>
            <th className="px-4 py-2.5 font-medium">최근 수정</th>
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
                  <div className="font-mono text-[11px] text-text-3">{a.domain}</div>
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
                    <Badge variant="mine">내 자산</Badge>
                  ) : a.owner ? (
                    <Badge variant="assigned">담당자 있음</Badge>
                  ) : (
                    <Badge variant="unassigned">미지정</Badge>
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
                    <span className="font-mono text-[11px] text-text-4">한 번도 없음</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
