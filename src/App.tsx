import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TopBar } from './components/layout/TopBar';
import { LanguageToggle } from './components/layout/LanguageToggle';
import { Pill } from './components/common/Pill';
import { UserChip } from './components/common/UserChip';
import { ToastProvider } from './components/feedback/Toast';
import { RequireNoticeResponse } from './components/RequireNoticeResponse';
import EmployeePage from './routes/EmployeePage';
import NoticePage from './routes/NoticePage';
import NoticeDonePage from './routes/NoticeDonePage';

const DashboardPage = lazy(() => import('./routes/DashboardPage'));
const ComponentsDemo = lazy(() => import('./routes/ComponentsDemo'));

function RouteFallback() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-[1280px] px-8 py-12 text-center text-[13px] text-text-3">
      {t('common.loading')}
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function NavLinks() {
  const { t } = useTranslation();
  const link = (to: string, label: string) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
          isActive ? 'bg-brand text-white' : 'text-text-3 hover:text-text'
        }`
      }
    >
      {label}
    </NavLink>
  );
  return (
    <nav className="flex items-center gap-1">
      {link('/notice', t('topbar.nav.notice'))}
      {link('/', t('topbar.nav.employee'))}
      {link('/dashboard', t('topbar.nav.dashboard'))}
      <a
        href="http://10.188.152.16:8082/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded px-2.5 py-1 font-mono text-[11px] text-text-3 transition-colors hover:text-text"
      >
        {t('topbar.nav.dashboardV2')}
      </a>
      {link('/demo', t('topbar.nav.demo'))}
    </nav>
  );
}

function TopBarRight() {
  const { t } = useTranslation();
  return (
    <>
      <NavLinks />
      <Pill dot="success">{t('topbar.campaignBadge')}</Pill>
      <UserChip name="박지훈" meta="보안운영실" />
      <LanguageToggle />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <TopBar right={<TopBarRight />} />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* 권고 안내 — 가드 미적용. 모든 사용자 진입 가능 (F-NOTICE-6,7). */}
              <Route path="/notice" element={<NoticePage />} />
              <Route path="/notice/done" element={<NoticeDonePage />} />
              {/* 자산 등록 — 권고 응답 가드 적용 (F-NOTICE-8). */}
              <Route element={<RequireNoticeResponse />}>
                <Route path="/" element={<EmployeePage />} />
              </Route>
              {/* 운영자/디자인 시스템 — 가드 미적용 (사용자 결정). */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/demo" element={<ComponentsDemo />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
