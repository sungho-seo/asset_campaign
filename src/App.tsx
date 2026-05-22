import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmployeePage from './routes/EmployeePage';
import DashboardPage from './routes/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function TempNav() {
  const link = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded text-xs font-mono ${
          isActive ? 'bg-accent text-white' : 'text-text-3 hover:text-text'
        }`
      }
    >
      {label}
    </NavLink>
  );
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-3.5">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-accent font-mono text-[13px] font-semibold tracking-tighter2 text-white">
            V
          </div>
          <div className="text-sm font-semibold tracking-tightish">
            VCISO 자산조사
            <span className="ml-1.5 font-normal text-text-3">/ 캠페인 2026</span>
          </div>
        </Link>
        <nav className="flex gap-1">
          {link('/', '임직원')}
          {link('/dashboard', '대시보드')}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TempNav />
        <Routes>
          <Route path="/" element={<EmployeePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
