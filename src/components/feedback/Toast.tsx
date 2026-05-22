import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/cn';

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  show: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClass: Record<ToastTone, string> = {
  success: 'border-success/30 text-success bg-white',
  error: 'border-danger/30 text-danger bg-white',
  info: 'border-line-2 text-text-2 bg-white',
};

const toneIcon: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }, 2400);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-8 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2">
        {items.map((it) => {
          const Icon = toneIcon[it.tone];
          return (
            <div
              key={it.id}
              className={cn(
                'pointer-events-auto flex items-center gap-2 rounded-md border px-3.5 py-2 shadow-lg',
                'text-[13px] font-medium',
                toneClass[it.tone]
              )}
              role="status"
            >
              <Icon className="h-4 w-4" />
              {it.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
