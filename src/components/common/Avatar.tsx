import { cn } from '../../lib/cn';

type Size = 'sm' | 'md';
type Tone = 'default' | 'alt';

type AvatarProps = {
  name: string;
  size?: Size;
  tone?: Tone;
  className?: string;
};

const sizeClass: Record<Size, string> = {
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-6 w-6 text-[11px]',
};

export function Avatar({ name, size = 'md', tone = 'default', className }: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <span
      className={cn(
        'grid place-items-center rounded-full font-semibold text-white',
        tone === 'alt' ? 'bg-purple' : 'bg-accent',
        sizeClass[size],
        className
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
