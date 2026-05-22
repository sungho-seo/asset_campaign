import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopBar } from './components/layout/TopBar';
import { Pill } from './components/common/Pill';
import { UserChip } from './components/common/UserChip';
import { ToastProvider } from './components/feedback/Toast';
import EmployeePage from './routes/EmployeePage';
import DashboardPage from './routes/DashboardPage';
import ComponentsDemo from './routes/ComponentsDemo';

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
          <Routes>
            <Route path="/" element={<EmployeePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/demo" element={<ComponentsDemo />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
