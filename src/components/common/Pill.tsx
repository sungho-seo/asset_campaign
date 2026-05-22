import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type PillProps = {
  children: ReactNode;
  dot?: 'success' | 'warn' | 'danger' | 'neutral';
  className?: string;
};

const dotClass: Record<NonNullable<PillProps['dot']>, string> = {
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
  neutral: 'bg-text-4',
};

export function Pill({ children, dot, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-white px-2.5 py-1',
        'text-xs font-mono font-medium text-text-2',
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClass[dot])} />}
      {children}
    </span>
  );
}
