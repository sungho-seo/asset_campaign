import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant =
  | 'unassigned'
  | 'assigned'
  | 'mine'
  | 'success'
  | 'danger'
  | 'warn'
  | 'neutral';

type BadgeProps = {
  variant: Variant;
  children: ReactNode;
  className?: string;
};

const variantClass: Record<Variant, string> = {
  unassigned: 'bg-warn-soft text-warn',
  assigned: 'bg-success-soft text-success',
  mine: 'bg-purple-soft text-purple',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-warn',
  neutral: 'bg-bg-soft text-text-3',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono font-medium',
        variantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
