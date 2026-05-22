import type { ReactNode } from 'react';
import { Info, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/cn';

type Tone = 'info' | 'warn' | 'danger' | 'success' | 'brand';

type BannerProps = {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

const config: Record<Tone, { Cmp: typeof Info; cls: string }> = {
  info: { Cmp: Info, cls: 'bg-focus-soft/40 border-focus/20 text-text-2' },
  warn: { Cmp: AlertTriangle, cls: 'bg-warn-soft/60 border-warn/30 text-text-2' },
  danger: { Cmp: AlertCircle, cls: 'bg-danger-soft/60 border-danger/30 text-text-2' },
  success: { Cmp: CheckCircle2, cls: 'bg-success-soft/60 border-success/30 text-text-2' },
  brand: { Cmp: Info, cls: 'bg-brand-soft border-brand/30 text-text-2' },
};

export function Banner({
  tone = 'info',
  title,
  children,
  actions,
  className,
}: BannerProps) {
  const { Cmp, cls } = config[tone];
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-[13px]',
        cls,
        className
      )}
    >
      <Cmp className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium text-text">{title}</div>}
        <div className={cn(title && 'mt-0.5', 'text-text-2')}>{children}</div>
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
