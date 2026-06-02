import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { isValidIPv4 } from '../../lib/validation';

type IPListProps = {
  values: string[];
  onChange: (next: string[]) => void;
  showErrors?: boolean;
  inputId?: string;
  // false면 IP 1개만 입력 가능 — '추가' 버튼 + 각 행의 X 버튼 숨김.
  // 자산 유형이 클라우드일 때만 true 권장.
  allowMultiple?: boolean;
};

export function IPList({
  values,
  onChange,
  showErrors,
  inputId,
  allowMultiple = true,
}: IPListProps) {
  const { t } = useTranslation();
  // 단일 IP 모드일 때는 입력란을 1개로 강제 — 초과 입력은 무시.
  // 부모(AssetForm)가 assetType 전환 시점에 ips를 1개로 잘라 두지만,
  // 안전망으로 렌더 측면에서도 1개만 노출.
  const visibleValues = allowMultiple ? values : values.slice(0, 1);

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
      {visibleValues.map((v, i) => {
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
            {allowMultiple && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={t('form.fields.removeIp')}
                className="grid h-9 w-9 place-items-center rounded-md border border-line text-text-3 hover:bg-bg-soft hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
      {allowMultiple && (
        <Button type="button" size="sm" variant="ghost" onClick={add}>
          <Plus className="h-3 w-3" /> {t('form.fields.addIp')}
        </Button>
      )}
    </div>
  );
}
