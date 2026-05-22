import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type PanelProps = {
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
};

export function Panel({
  title,
  subtitle,
  headerRight,
  children,
  className,
  bodyClassName,
  padded = true,
}: PanelProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-line bg-panel shadow-sm',
        className
      )}
    >
      {(title || headerRight) && (
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex flex-col gap-[1px]">
            {title && (
              <h3 className="text-[13.5px] font-semibold tracking-tightish text-text">
                {title}
              </h3>
            )}
            {subtitle && (
              <div className="font-mono text-[11.5px] text-text-3">{subtitle}</div>
            )}
          </div>
          {headerRight && (
            <div className="flex items-center gap-1.5 text-xs text-text-3">
              {headerRight}
            </div>
          )}
        </header>
      )}
      <div className={cn(padded && 'px-5 py-4', bodyClassName)}>{children}</div>
    </section>
  );
}
