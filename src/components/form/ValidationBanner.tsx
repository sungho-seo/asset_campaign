import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

export type ValidationError = {
  key: string;
  label: string;
  onClick?: () => void;
};

type ValidationBannerProps = {
  errors: ValidationError[];
  className?: string;
};

export function ValidationBanner({ errors, className }: ValidationBannerProps) {
  const { t } = useTranslation();
  if (errors.length === 0) return null;
  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border border-danger/30 bg-danger-soft/50 px-4 py-3',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-text">
            {t('form.validationBanner.title', { count: errors.length })}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {errors.map((err) => (
              <button
                key={err.key}
                type="button"
                onClick={err.onClick}
                className={cn(
                  'rounded px-2 py-1 text-[11px] font-mono font-medium',
                  'border border-danger/30 bg-white text-danger',
                  'hover:bg-danger-soft transition-colors'
                )}
              >
                {err.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
