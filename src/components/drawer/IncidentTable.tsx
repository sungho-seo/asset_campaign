import type { IncidentDetail, IncidentKey, IncidentRow } from '../../types/domain';
import { Avatar } from '../common/Avatar';
import { cn } from '../../lib/cn';

type IncidentTableProps = {
  detail: IncidentDetail;
  filter: string;
};

function rowMatches(row: IncidentRow, f: string): boolean {
  if (!f) return true;
  const needle = f.toLowerCase();
  return Object.values(row).some((v) => String(v).toLowerCase().includes(needle));
}

function renderRow(key: IncidentKey, row: IncidentRow): React.ReactNode {
  switch (key) {
    case 'dup-edit':
      return (
        <>
          <td className="px-6 py-3.5 align-top">
            <div className="font-mono text-[12.5px] font-medium text-text">{String(row.ip)}</div>
            <div className="mt-0.5 text-[11.5px] text-text-3">{String(row.host)}</div>
          </td>
          <td className="px-6 py-3.5 align-top">
            <div className="flex flex-wrap items-center gap-1.5">
              <Avatar name={String(row.a)} size="sm" />
              <span className="text-[12px] text-text-2">{String(row.a)}</span>
              <span className="font-mono text-[10px] text-text-4">vs</span>
              <Avatar name={String(row.b)} size="sm" tone="alt" />
              <span className="text-[12px] text-text-2">{String(row.b)}</span>
            </div>
          </td>
          <td className="px-6 py-3.5 align-top font-mono text-[11.5px] text-text-3">
            {String(row.when)}
          </td>
        </>
      );
    case 'overwrite-5min':
      return (
        <>
          <td className="px-6 py-3.5 align-top">
            <div className="font-mono text-[12.5px] font-medium text-text">{String(row.ip)}</div>
            <div className="mt-0.5 text-[11.5px] text-text-3">{String(row.host)}</div>
          </td>
          <td className="px-6 py-3.5 align-top">
            <div className="flex flex-wrap items-center gap-1.5">
              <Avatar name={String(row.who)} size="sm" />
              <span className="text-[12px] text-text-2">{String(row.who)}</span>
              <span className="font-mono text-[10px] text-text-4">덮어씀</span>
              <span className="text-[12px] text-text-4 line-through">{String(row.prev)}</span>
            </div>
          </td>
          <td className="px-6 py-3.5 align-top font-mono text-[11.5px] text-text-3">
            {String(row.when)}
          </td>
        </>
      );
    case 'ip-dup':
      return (
        <>
          <td className="px-6 py-3.5 align-top">
            <div className="font-mono text-[12.5px] font-medium text-text">{String(row.ip)}</div>
          </td>
          <td className="px-6 py-3.5 align-top">
            <div className="font-mono text-[12.5px] font-medium text-text">
              {String(row.host).split('.')[0]}
            </div>
            <div className="mt-0.5 text-[11.5px] text-text-3">{String(row.host)}</div>
          </td>
          <td className="px-6 py-3.5 align-top">
            <span className="flex items-center gap-1.5">
              <Avatar name={String(row.who)} size="sm" />
              <span className="text-[12px] text-text-2">{String(row.who)}</span>
            </span>
          </td>
          <td className="px-6 py-3.5 align-top font-mono text-[11.5px] text-text-3">
            {String(row.when)}
          </td>
        </>
      );
    case 'zero-to-new':
      return (
        <>
          <td className="px-6 py-3.5 align-top">
            <div className="font-mono text-[12.5px] font-medium text-text">{String(row.kw)}</div>
          </td>
          <td className="px-6 py-3.5 align-top">
            <span className="flex items-center gap-1.5">
              <Avatar name={String(row.who)} size="sm" />
              <span className="text-[12px] text-text-2">{String(row.who)}</span>
            </span>
          </td>
          <td className="px-6 py-3.5 align-top">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 font-mono text-[11px] font-medium',
                row.resultType === 'ok'
                  ? 'bg-success-soft text-success'
                  : 'bg-danger-soft text-danger'
              )}
            >
              {String(row.result)}
            </span>
          </td>
          <td className="px-6 py-3.5 align-top font-mono text-[11.5px] text-text-3">
            {String(row.when)}
          </td>
        </>
      );
    case 'retry-abandon':
      return (
        <>
          <td className="px-6 py-3.5 align-top">
            <div className="font-mono text-[12.5px] font-medium text-text">{String(row.ip)}</div>
            <div className="mt-0.5 text-[11.5px] text-text-3">{String(row.host)}</div>
          </td>
          <td className="px-6 py-3.5 align-top">
            <span className="flex items-center gap-1.5">
              <Avatar name={String(row.who)} size="sm" />
              <span className="text-[12px] text-text-2">{String(row.who)}</span>
            </span>
          </td>
          <td className="px-6 py-3.5 align-top text-[12px] text-text-2">{String(row.reason)}</td>
          <td className="px-6 py-3.5 align-top">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 font-mono text-[11px] font-medium',
                row.resultType === 'ok'
                  ? 'bg-success-soft text-success'
                  : 'bg-danger-soft text-danger'
              )}
            >
              {String(row.result)}
            </span>
          </td>
        </>
      );
  }
}

export function IncidentTable({ detail, filter }: IncidentTableProps) {
  const rows = detail.rows.filter((r) => rowMatches(r, filter));
  return (
    <table className="w-full text-[12.5px]">
      <thead>
        <tr>
          {detail.columns.map((c) => (
            <th
              key={c}
              className="sticky top-0 z-[1] border-b border-line bg-bg-soft/60 px-6 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-wider text-text-3"
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={detail.columns.length}
              className="px-6 py-12 text-center text-[12.5px] text-text-3"
            >
              필터 조건에 맞는 결과가 없습니다.
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr key={String(r.id)} className="border-b border-line transition-colors hover:bg-bg-soft/50">
              {renderRow(detail.key, r)}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
