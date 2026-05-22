import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
  emptyFlag?: boolean;
  options: Array<{ value: string; label: string } | string>;
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, emptyFlag, options, placeholder, className, value, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      value={value ?? ''}
      className={cn(
        'w-full appearance-none rounded-md border bg-white px-3 py-2 text-sm text-text outline-none transition',
        'bg-[url(\"data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2378716c%27 stroke-width=%272.2%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27><polyline points=%276 9 12 15 18 9%27/></svg>\")] bg-[length:14px_14px] bg-[position:right_10px_center] bg-no-repeat pr-9',
        'focus:border-focus focus:ring-2 focus:ring-focus-soft',
        emptyFlag && !error && 'bg-warn-soft/40',
        error
          ? 'border-danger focus:border-danger focus:ring-danger-soft'
          : 'border-line hover:border-line-2',
        !value && 'text-text-4',
        className
      )}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => {
        const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
        return (
          <option key={o.value} value={o.value} className="text-text">
            {o.label}
          </option>
        );
      })}
    </select>
  );
});
