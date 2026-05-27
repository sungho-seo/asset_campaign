import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import type { Owner } from '../../types/domain';
import { cn } from '../../lib/cn';

type DirectoryDropdownProps = {
  anchorRef: RefObject<HTMLElement | null>;
  results: Owner[];
  loading: boolean;
  onPick: (p: Owner) => void;
  onClose: () => void;
};

export function DirectoryDropdown({
  anchorRef,
  results,
  loading,
  onPick,
  onClose,
}: DirectoryDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  // anchor 위치/사이즈 추적.
  // mount 시점에 anchor가 null이거나 사이즈가 0일 수 있으므로 (사이드 드로어 transition 등)
  // requestAnimationFrame으로 anchor가 valid해질 때까지 재시도 + 이후 ResizeObserver로 추적.
  useLayoutEffect(() => {
    let rafId = 0;
    let ro: ResizeObserver | null = null;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      // anchor가 아직 layout되지 않았으면 다음 프레임에 재시도
      if (rect.width === 0 && rect.height === 0) {
        rafId = requestAnimationFrame(update);
        return;
      }
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 440),
      });
      // 최초 valid 측정 시점에 ResizeObserver attach
      if (!ro) {
        ro = new ResizeObserver(update);
        ro.observe(anchor);
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [anchorRef, onClose]);

  // ESC 닫기 (드로어/모달과 동일한 키 우선순위 — 캡처해서 드로어 ESC 전에 처리)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return createPortal(
    <div
      ref={dropdownRef}
      role="listbox"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
      }}
      className="z-[55] max-h-72 overflow-y-auto rounded-md border border-line bg-white shadow-lg"
    >
      <div className="sticky top-0 z-[1] border-b border-line bg-bg-soft/60 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-text-3">
        {loading ? '검색 중…' : `구성원 ${results.length}건`}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 px-3 py-3 text-[12px] text-text-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          디렉토리에서 일치하는 구성원을 찾는 중입니다.
        </div>
      ) : results.length === 0 ? (
        <div className="px-3 py-4 text-center text-[12px] text-text-3">
          일치하는 구성원이 없습니다.
          <div className="mt-0.5 text-[11px] text-text-4">
            정확한 이름을 입력 후 다시 Enter를 눌러주세요.
          </div>
        </div>
      ) : (
        <ul role="presentation">
          {results.map((p, i) => (
            <li key={`${p.email}-${i}`}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onPick(p)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left',
                  'transition-colors hover:bg-brand-soft/40 last:border-b-0',
                  'focus:bg-brand-soft/40 focus:outline-none'
                )}
              >
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-bg-soft font-semibold text-text-2">
                  {p.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-text">
                    {p.name}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-text-3">
                    {p.email}
                  </span>
                </span>
                <span className="flex-shrink-0 rounded bg-bg-soft px-1.5 py-0.5 font-mono text-[10.5px] text-text-3">
                  {p.dept}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body
  );
}
