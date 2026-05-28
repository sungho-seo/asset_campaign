import { useTranslation } from 'react-i18next';
import type { SearchMode } from '../../types/domain';
import { cn } from '../../lib/cn';

type SearchTabsProps = {
  value: SearchMode;
  onChange: (v: SearchMode) => void;
};

const TAB_KEYS: Array<{ value: SearchMode; key: string }> = [
  { value: 'all', key: 'employee.searchTabs.all' },
  { value: 'ip', key: 'employee.searchTabs.ip' },
  { value: 'hostname', key: 'employee.searchTabs.hostname' },
  { value: 'owner', key: 'employee.searchTabs.owner' },
  { value: 'email', key: 'employee.searchTabs.email' },
];

export function SearchTabs({ value, onChange }: SearchTabsProps) {
  const { t } = useTranslation();
  return (
    <div role="tablist" className="flex border-b border-line">
      {TAB_KEYS.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative px-4 py-2.5 text-[13px] font-medium transition-colors',
              active
                ? 'text-text after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand'
                : 'text-text-3 hover:text-text-2'
            )}
          >
            {t(tab.key)}
          </button>
        );
      })}
    </div>
  );
}
