import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

type IconColor = 'green' | 'amber' | 'red' | 'purple' | 'gray';

type MetricRowProps = {
  icon: LucideIcon;
  iconColor: IconColor;
  name: string;
  description: string;
  value: string | number;
  unit?: string;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
  onClick?: () => void;
};

const iconClass: Record<IconColor, string> = {
  green: 'bg-success-soft text-success',
  amber: 'bg-warn-soft text-warn',
  red: 'bg-danger-soft text-danger',
  purple: 'bg-purple-soft text-purple',
  gray: 'bg-bg-soft text-text-3',
};

const deltaClass: Record<'up' | 'down' | 'flat', string> = {
  up: 'bg-success-soft text-success',
  down: 'bg-danger-soft text-danger',
  flat: 'bg-bg-soft text-text-3',
};

export function MetricRow({
  icon: Icon,
  iconColor,
  name,
  description,
  value,
  unit,
  delta,
  onClick,
}: MetricRowProps) {
  const clickable = !!onClick;
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'group flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-b-0',
        'transition-colors',
        clickable ? 'cursor-pointer hover:bg-bg-soft' : 'hover:bg-bg-soft'
      )}
    >
      <span className={cn('grid h-7 w-7 flex-shrink-0 place-items-center rounded-md', iconClass[iconColor])}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <div className="text-[13px] font-medium text-text">{name}</div>
        <div className="text-[11.5px] text-text-3">{description}</div>
      </div>
      <div className="flex flex-shrink-0 items-baseline gap-1.5">
        <div className="font-mono text-lg font-semibold tracking-tightish text-text">
          {value}
          {unit && <span className="ml-0.5 text-[11px] font-medium text-text-3">{unit}</span>}
        </div>
        {delta && (
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-mono text-[10.5px] font-medium',
              deltaClass[delta.direction]
            )}
          >
            {delta.value}
          </span>
        )}
      </div>
      {clickable && (
        <ChevronRight className="ml-2 h-3.5 w-3.5 flex-shrink-0 text-text-4 transition-transform group-hover:translate-x-0.5 group-hover:text-text" />
      )}
    </div>
  );
}
