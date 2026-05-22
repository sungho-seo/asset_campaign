import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopBar } from './components/layout/TopBar';
import { Pill } from './components/common/Pill';
import { UserChip } from './components/common/UserChip';
import { ToastProvider } from './components/feedback/Toast';
import EmployeePage from './routes/EmployeePage';

const DashboardPage = lazy(() => import('./routes/DashboardPage'));
const ComponentsDemo = lazy(() => import('./routes/ComponentsDemo'));

function RouteFallback() {
  return (
    <div className="mx-auto max-w-[1280px] px-8 py-12 text-center text-[13px] text-text-3">
      불러오는 중…
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function NavLinks() {
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
      {link('/', '임직원')}
      {link('/dashboard', '대시보드')}
      {link('/demo', 'DS')}
    </nav>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <TopBar
            right={
              <>
                <NavLinks />
                <Pill dot="success">캠페인 진행중 · D+7</Pill>
                <UserChip name="박지훈" meta="보안운영실" />
              </>
            }
          />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<EmployeePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/demo" element={<ComponentsDemo />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
