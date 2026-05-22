import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type Delta = { value: string; positive?: boolean };

type KPICardProps = {
  label: string;
  icon: LucideIcon;
  value: string | number;
  unit?: string;
  delta?: Delta;
  variant?: 'default' | 'progress';
  progressFill?: number;
  progressMeta?: { left: string; right: string };
};

export function KPICard({
  label,
  icon: Icon,
  value,
  unit,
  delta,
  variant = 'default',
  progressFill,
  progressMeta,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-line p-5 shadow-sm',
        variant === 'progress'
          ? 'bg-gradient-to-b from-white to-bg-soft/40'
          : 'bg-white'
      )}
    >
      <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-text-3">
        <span className="grid h-[18px] w-[18px] place-items-center rounded bg-bg-soft text-text-3">
          <Icon className="h-2.5 w-2.5" />
        </span>
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 leading-none">
        <div className="text-[26px] font-semibold tracking-tighter2">{value}</div>
        {unit && <span className="text-[13px] font-medium text-text-3">{unit}</span>}
      </div>
      {variant === 'progress' && progressFill !== undefined ? (
        <>
          <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-bg-soft">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-text-2 transition-[width] duration-500"
              style={{ width: `${progressFill}%` }}
            />
          </div>
          {progressMeta && (
            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-text-3">
              <span>{progressMeta.left}</span>
              <span>{progressMeta.right}</span>
            </div>
          )}
        </>
      ) : (
        delta && (
          <div
            className={cn(
              'mt-2 flex items-center gap-1.5 text-[11.5px] text-text-3'
            )}
          >
            <strong
              className={cn(
                'font-mono font-semibold',
                delta.positive === false ? 'text-danger' : 'text-success'
              )}
            >
              {delta.value}
            </strong>
            어제 대비
          </div>
        )
      )}
    </div>
  );
}
