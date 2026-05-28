import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

type Icon = 'warn' | 'danger' | 'info';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  icon?: Icon;
  title: string;
  description?: string;
  children?: ReactNode;
  actions: ReactNode;
};

const iconConfig: Record<Icon, { Cmp: typeof AlertTriangle; tone: string }> = {
  warn: { Cmp: AlertTriangle, tone: 'bg-warn-soft text-warn' },
  danger: { Cmp: AlertCircle, tone: 'bg-danger-soft text-danger' },
  info: { Cmp: Info, tone: 'bg-focus-soft text-focus' },
};

export function Modal({
  open,
  onClose,
  icon = 'warn',
  title,
  description,
  children,
  actions,
}: ModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;
  const { Cmp, tone } = iconConfig[icon];

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-text/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative z-[61] w-[min(480px,calc(100vw-32px))] rounded-lg border border-line bg-white shadow-lg',
          'animate-in fade-in zoom-in-95'
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('modal.close')}
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-text-3 hover:bg-bg-soft hover:text-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="px-6 pb-2 pt-6">
          <div className="flex items-start gap-3">
            <span className={cn('grid h-9 w-9 place-items-center rounded-lg', tone)}>
              <Cmp className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="modal-title" className="text-base font-semibold tracking-tightish">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-[13px] leading-relaxed text-text-3">
                  {description}
                </p>
              )}
            </div>
          </div>
          {children && <div className="mt-4">{children}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line bg-bg/40 px-6 py-3">
          {actions}
        </div>
      </div>
    </div>,
    document.body
  );
}
