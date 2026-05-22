import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'mono';
  error?: boolean;
  emptyFlag?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = 'default', error, emptyFlag, className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-md border bg-white px-3 py-2 text-sm text-text outline-none transition',
        'placeholder:text-text-4',
        'focus:border-focus focus:ring-2 focus:ring-focus-soft',
        variant === 'mono' && 'font-mono tracking-tight',
        emptyFlag && !error && 'bg-warn-soft/40',
        error
          ? 'border-danger focus:border-danger focus:ring-danger-soft'
          : 'border-line hover:border-line-2',
        className
      )}
      {...rest}
    />
  );
});
