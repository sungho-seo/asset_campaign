import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ShellProps = {
  children: ReactNode;
  className?: string;
};

export function Shell({ children, className }: ShellProps) {
  return (
    <main className={cn('mx-auto max-w-[1280px] px-8 pb-20 pt-8', className)}>
      {children}
    </main>
  );
}
