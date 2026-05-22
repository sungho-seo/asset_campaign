import { Plus, X } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { isValidIPv4 } from '../../lib/validation';

type IPListProps = {
  values: string[];
  onChange: (next: string[]) => void;
  showErrors?: boolean;
  inputId?: string;
};

export function IPList({ values, onChange, showErrors, inputId }: IPListProps) {
  const update = (i: number, v: string) => {
    const cleaned = v.replace(/[^0-9.]/g, '');
    const next = [...values];
    next[i] = cleaned;
    onChange(next);
  };
  const add = () => onChange([...values, '']);
  const remove = (i: number) => {
    if (values.length <= 1) {
      onChange(['']);
      return;
    }
    onChange(values.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      {values.map((v, i) => {
        const invalid = !!showErrors && v.length > 0 && !isValidIPv4(v);
        const empty = !!showErrors && v.length === 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <Input
              id={i === 0 ? inputId : undefined}
              variant="mono"
              placeholder="___.___.___.___"
              value={v}
              error={invalid}
              emptyFlag={empty}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="IP 삭제"
              className="grid h-9 w-9 place-items-center rounded-md border border-line text-text-3 hover:bg-bg-soft hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      <Button type="button" size="sm" variant="ghost" onClick={add}>
        <Plus className="h-3 w-3" /> IP 추가
      </Button>
    </div>
  );
}
