import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { SearchMode } from '../../types/domain';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { isValidIPv4 } from '../../lib/validation';
import { cn } from '../../lib/cn';

type SearchBoxProps = {
  mode: SearchMode;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onFocusInput?: () => void;
};

const PLACEHOLDER: Record<SearchMode, string> = {
  all: 'IP / 자산명 / 이름 / 이메일 로 검색하세요',
  ip: '___.___.___.___',
  hostname: '자산명(Host Name)으로 검색하세요',
  owner: '담당자 이름으로 검색하세요',
  email: '담당자 이메일로 검색하세요',
};

export function SearchBox({
  mode,
  value,
  onChange,
  onSubmit,
  onClear,
  onFocusInput,
}: SearchBoxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [mode]);

  const showIPError = mode === 'ip' && value.length > 0 && !isValidIPv4(value);

  const handleChange = (raw: string) => {
    if (mode === 'ip') {
      const cleaned = raw.replace(/[^0-9.]/g, '');
      onChange(cleaned);
    } else {
      onChange(raw);
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 transition',
          showIPError
            ? 'border-danger focus-within:ring-2 focus-within:ring-danger-soft'
            : 'border-line focus-within:border-focus focus-within:ring-2 focus-within:ring-focus-soft'
        )}
      >
        <Search className="h-4 w-4 flex-shrink-0 text-text-4" />
        <Input
          ref={ref}
          variant={mode === 'ip' ? 'mono' : 'default'}
          placeholder={PLACEHOLDER[mode]}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => onFocusInput?.()}
          onClick={() => onFocusInput?.()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
          }}
          className="flex-1 border-0 px-0 py-0.5 focus:ring-0"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              onClear();
              ref.current?.focus();
            }}
            aria-label="검색어 지우기"
            className="grid h-6 w-6 place-items-center rounded text-text-4 hover:bg-bg-soft hover:text-text-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <Button size="sm" variant="primary" onClick={onSubmit}>
          검색
        </Button>
      </div>
      {showIPError && (
        <p className="px-1 font-mono text-[11.5px] text-danger">
          IP 형식이 올바르지 않습니다. 예: 10.20.30.40
        </p>
      )}
    </div>
  );
}
