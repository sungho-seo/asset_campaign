import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type FieldProps = {
  id?: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline gap-1.5 text-[12.5px] font-medium text-text-2">
        {label}
        {required && <span className="text-danger">*</span>}
        {hint && <span className="font-normal text-text-3">{hint}</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="font-mono text-[11.5px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
