import type { SearchMode } from '../../types/domain';
import { cn } from '../../lib/cn';

type SearchTabsProps = {
  value: SearchMode;
  onChange: (v: SearchMode) => void;
};

const TABS: Array<{ value: SearchMode; label: string }> = [
  { value: 'all', label: '통합' },
  { value: 'ip', label: 'IP' },
  { value: 'hostname', label: '자산명' },
  { value: 'owner', label: '내가 담당자' },
  { value: 'email', label: '내 이메일' },
];

export function SearchTabs({ value, onChange }: SearchTabsProps) {
  return (
    <div role="tablist" className="flex border-b border-line">
      {TABS.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative px-4 py-2.5 text-[13px] font-medium transition-colors',
              active
                ? 'text-text after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand'
                : 'text-text-3 hover:text-text-2'
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
