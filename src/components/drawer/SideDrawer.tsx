import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

type SideDrawerProps = {
  open: boolean;
  onClose: () => void;
  width?: number;
  header: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
};

export function SideDrawer({
  open,
  onClose,
  width = 680,
  header,
  toolbar,
  children,
  footer,
  ariaLabel,
}: SideDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 모달이 위에 있으면 모달이 stopPropagation으로 먼저 잡음
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-text/30 transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={{ width: `min(${width}px, 100vw)` }}
        className={cn(
          'fixed inset-y-0 right-0 z-[41] flex flex-col bg-white shadow-lg',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="relative flex flex-shrink-0 items-start justify-between gap-4 border-b border-line bg-gradient-to-r from-brand-soft/55 via-white to-white px-6 py-4">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-brand" />
          <div className="min-w-0 flex-1">{header}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md border border-line bg-white text-text-3 hover:bg-bg-soft hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {toolbar && (
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-line bg-bg/40 px-6 py-2.5">
            {toolbar}
          </div>
        )}
        <div className="scrollbar-thin flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-line bg-bg/40 px-6 py-3">
            {footer}
          </div>
        )}
      </aside>
    </>,
    document.body
  );
}
