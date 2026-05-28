import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type TopBarProps = {
  right?: ReactNode;
  subtitle?: string;
};

export function TopBar({ right, subtitle }: TopBarProps) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-3.5">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-brand font-mono text-[13px] font-semibold tracking-tighter2 text-white">
            V
          </div>
          <div className="text-sm font-semibold tracking-tightish">
            {t('topbar.brand')}
            <span className="ml-1.5 font-normal text-text-3">/ {subtitle ?? t('topbar.subtitle')}</span>
          </div>
        </Link>
        {right && <div className="flex items-center gap-4">{right}</div>}
      </div>
    </header>
  );
}
