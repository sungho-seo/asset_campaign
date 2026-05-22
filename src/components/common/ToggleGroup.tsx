import { cn } from '../../lib/cn';

type Option<T extends string> = { value: T; label: string };

type ToggleGroupProps<T extends string> = {
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  error?: boolean;
  name?: string;
  disabled?: boolean;
};

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  error,
  name,
  disabled,
}: ToggleGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        'inline-flex rounded-md border bg-white p-0.5 gap-0.5',
        error ? 'border-danger' : 'border-line'
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-medium font-mono transition',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
              active
                ? 'bg-accent text-white'
                : 'text-text-3 hover:text-text hover:bg-bg-soft',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
