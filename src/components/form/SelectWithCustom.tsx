import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from './Select';
import { Input } from '../common/Input';

type SelectWithCustomProps = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
  emptyFlag?: boolean;
  customInputPlaceholder?: string;
  // 옵션 표시 라벨 변환 (i18n 등). 저장 값은 그대로 두고 표시만 바꿈.
  labelFor?: (value: string) => string;
};

const CUSTOM_KEY = '__custom__';

function isCustomValue(value: string, options: string[]): boolean {
  return value !== '' && !options.includes(value);
}

export function SelectWithCustom({
  id,
  value,
  onChange,
  options,
  placeholder,
  error,
  emptyFlag,
  customInputPlaceholder,
  labelFor,
}: SelectWithCustomProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('form.selectPlaceholder');
  const resolvedCustomPlaceholder = customInputPlaceholder ?? t('form.customInput');
  // 명시적으로 직접입력을 선택한 경우 / 또는 값이 옵션에 없으면 직접입력 모드
  const [explicitCustom, setExplicitCustom] = useState(false);
  const isCustom = explicitCustom || isCustomValue(value, options);
  const customInputRef = useRef<HTMLInputElement>(null);

  // 직접입력 모드 진입 시 input에 자동 포커스
  useEffect(() => {
    if (explicitCustom) {
      customInputRef.current?.focus();
    }
  }, [explicitCustom]);

  const selectValue = isCustom ? CUSTOM_KEY : value;

  return (
    <div className="space-y-2">
      <Select
        id={id}
        value={selectValue}
        error={error}
        emptyFlag={emptyFlag}
        placeholder={resolvedPlaceholder}
        options={[
          ...options.map((o) => ({ value: o, label: labelFor ? labelFor(o) : o })),
          { value: CUSTOM_KEY, label: t('form.customOption') },
        ]}
        onChange={(e) => {
          const v = e.target.value;
          if (v === CUSTOM_KEY) {
            setExplicitCustom(true);
            onChange('');
          } else {
            setExplicitCustom(false);
            onChange(v);
          }
        }}
      />
      {isCustom && (
        <Input
          ref={customInputRef}
          placeholder={resolvedCustomPlaceholder}
          value={value}
          error={error}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
