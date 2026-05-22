import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'relative mb-6 overflow-hidden rounded-lg border border-line bg-white shadow-sm',
        // 좌→우 브랜드 핑크 → 흰색 그라데이션
        'bg-gradient-to-r from-brand-soft/55 via-white to-white',
        className
      )}
    >
      {/* 좌측 브랜드 컬러 강조 막대 */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-brand" />
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-5">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-brand">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tighter2 text-text">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[13px] text-text-3">{subtitle}</p>
          )}
        </div>
        {right && <div className="flex items-center gap-3">{right}</div>}
      </div>
    </header>
  );
}
