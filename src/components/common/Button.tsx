import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClass: Record<Variant, string> = {
  default:
    'bg-white border border-line-2 text-text-2 hover:bg-bg-soft hover:border-text-3 hover:text-text',
  primary:
    'bg-accent border border-accent text-white hover:bg-text-2 hover:border-text-2',
  ghost:
    'bg-transparent border border-transparent text-text-2 hover:bg-bg-soft hover:text-text',
  danger:
    'bg-danger border border-danger text-white hover:bg-danger-2 hover:border-danger-2',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-md',
  md: 'px-3 py-1.5 text-[12.5px] gap-1.5 rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', className, type = 'button', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium font-sans transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
