import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import type { AssetOwner, Owner } from '../../types/domain';
import { OWNER_ROLE_VALUES, toAssetOwner } from '../../types/domain';
import { searchDirectory } from '../../lib/api';
import { Input } from '../common/Input';
import { Field } from './Field';
import { Select } from './Select';
import { DirectoryDropdown } from './DirectoryDropdown';
import { cn } from '../../lib/cn';

export type OwnerRowField = 'name' | 'email' | 'dept' | 'role';

type OwnerRowProps = {
  // 폼 내 식별자. 입력 id 및 ref 등록 시 prefix로 사용 (예: 'owner', 'additionalOwners.0').
  rowId: string;
  value: AssetOwner;
  onChange: (next: AssetOwner) => void;
  required?: boolean;
  // 자동 채움 상태 (primary 전용): 첫 클릭/포커스 시 사용자가 명시적으로 다른 사람을 검색할 수 있도록 비움.
  autoFilled?: boolean;
  onAutoFilledConsumed?: () => void;
  // 빈 값 시각 단서 (mode === 'new' 전용)
  emptyFlag?: (field: OwnerRowField) => boolean;
  // ValidationBanner의 점프 타깃이 되는 ref 등록. errors prop과 결합해 사용.
  registerRef?: (field: OwnerRowField, el: HTMLDivElement | null) => void;
  // 필드별 에러 메시지 (이미 t()로 번역된 문자열). 미입력 시 undefined.
  errors?: Partial<Record<OwnerRowField, string | undefined>>;
  // 필드가 touched 됐다는 상태를 부모에 통보 — 부모는 errors 클리어 등을 수행.
  onFieldChange?: (field: OwnerRowField) => void;
  // 추가 담당자 행에서만 표시되는 X 버튼.
  onRemove?: () => void;
};

// 4-컬럼 그리드: 이름/이메일/부서/역할. 마지막 컬럼은 폭 고정.
// 추가 담당자 행은 X 버튼이 추가되어 [auto] 컬럼이 우측에 붙음.
const COL_TEMPLATE_PRIMARY = 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 150px';
const COL_TEMPLATE_REMOVABLE = 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 150px 36px';

export function OwnerRow({
  rowId,
  value,
  onChange,
  required = false,
  autoFilled = false,
  onAutoFilledConsumed,
  emptyFlag,
  registerRef,
  errors = {},
  onFieldChange,
  onRemove,
}: OwnerRowProps) {
  const { t } = useTranslation();

  // ─ 디렉토리 자동 검색 (이름 input)
  const nameAnchorRef = useRef<HTMLDivElement | null>(null);
  const [dirOpen, setDirOpen] = useState(false);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirResults, setDirResults] = useState<Owner[]>([]);
  const dirDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirRequestSeq = useRef(0);

  useEffect(() => {
    return () => {
      if (dirDebounceRef.current) clearTimeout(dirDebounceRef.current);
    };
  }, []);

  const runDirectorySearch = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setDirOpen(false);
      setDirResults([]);
      setDirLoading(false);
      return;
    }
    const seq = ++dirRequestSeq.current;
    setDirOpen(true);
    setDirLoading(true);
    try {
      const r = await searchDirectory(trimmed);
      if (seq !== dirRequestSeq.current) return;
      setDirResults(r);
    } finally {
      if (seq === dirRequestSeq.current) setDirLoading(false);
    }
  };

  const scheduleDirectorySearch = (name: string) => {
    if (dirDebounceRef.current) clearTimeout(dirDebounceRef.current);
    dirDebounceRef.current = setTimeout(() => {
      void runDirectorySearch(name);
    }, 200);
  };

  const updateField = (field: OwnerRowField, next: string) => {
    onChange({ ...value, [field]: next });
    onFieldChange?.(field);
  };

  const pickDirectoryPerson = (p: Owner) => {
    if (dirDebounceRef.current) clearTimeout(dirDebounceRef.current);
    dirRequestSeq.current++;
    // 사람만 교체하고 역할은 보존 (역할은 자산-담당자 컨텍스트라 디렉토리에 없음).
    onChange(toAssetOwner(p, value.role));
    onFieldChange?.('name');
    onFieldChange?.('email');
    onFieldChange?.('dept');
    setDirOpen(false);
  };

  const handleNameFocus = () => {
    if (autoFilled) {
      // 자동 채움 상태 첫 클릭: 사용자가 검색할 수 있도록 3필드 비움. 역할은 유지.
      onChange({ name: '', email: '', dept: '', role: value.role });
      onFieldChange?.('name');
      onFieldChange?.('email');
      onFieldChange?.('dept');
      onAutoFilledConsumed?.();
    }
  };

  const setNameAnchorRef = useCallback(
    (el: HTMLDivElement | null) => {
      nameAnchorRef.current = el;
      registerRef?.('name', el);
    },
    [registerRef]
  );

  const setFieldRef =
    (field: OwnerRowField) =>
    (el: HTMLDivElement | null) => {
      registerRef?.(field, el);
    };

  const idFor = (field: OwnerRowField) => `${rowId}.${field}`;
  const isFlag = (field: OwnerRowField) => emptyFlag?.(field) ?? false;

  const roleOptions = [
    { value: '', label: '—' },
    ...OWNER_ROLE_VALUES.map((v) => ({
      value: v,
      label: t(`options.ownerRole.${v}`),
    })),
  ];

  const gridTemplate = onRemove ? COL_TEMPLATE_REMOVABLE : COL_TEMPLATE_PRIMARY;

  return (
    <div
      className={cn(
        'relative grid gap-3',
        // 그리드 컬럼은 inline style로 — Tailwind arbitrary values는 동적 값 지원이 약함.
        // 항목 수가 고정이므로 두 패턴 중 하나만 사용됨.
      )}
      style={{ gridTemplateColumns: gridTemplate }}
    >
      <div ref={setNameAnchorRef}>
        <Field
          id={idFor('name')}
          label={t('form.fields.ownerName')}
          required={required}
          error={errors.name}
        >
          <Input
            id={idFor('name')}
            autoComplete="off"
            value={value.name}
            emptyFlag={isFlag('name')}
            error={!!errors.name}
            onFocus={handleNameFocus}
            onClick={handleNameFocus}
            onChange={(e) => {
              const next = e.target.value;
              updateField('name', next);
              // 사용자가 직접 타이핑 시작했다면 자동 채움 상태도 해제
              if (autoFilled) onAutoFilledConsumed?.();
              scheduleDirectorySearch(next);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (dirDebounceRef.current) clearTimeout(dirDebounceRef.current);
                void runDirectorySearch(value.name);
              } else if (e.key === 'Escape' && dirOpen) {
                e.stopPropagation();
                setDirOpen(false);
              }
            }}
          />
        </Field>
        {dirOpen && (
          <DirectoryDropdown
            anchorRef={nameAnchorRef}
            results={dirResults}
            loading={dirLoading}
            onPick={pickDirectoryPerson}
            onClose={() => setDirOpen(false)}
          />
        )}
      </div>

      <div ref={setFieldRef('email')}>
        <Field
          id={idFor('email')}
          label={t('form.fields.ownerEmail')}
          required={required}
          error={errors.email}
        >
          <Input
            id={idFor('email')}
            type="email"
            value={value.email}
            emptyFlag={isFlag('email')}
            error={!!errors.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </Field>
      </div>

      <div ref={setFieldRef('dept')}>
        <Field
          id={idFor('dept')}
          label={t('form.fields.ownerDept')}
          required={required}
          error={errors.dept}
        >
          <Input
            id={idFor('dept')}
            value={value.dept}
            emptyFlag={isFlag('dept')}
            error={!!errors.dept}
            onChange={(e) => updateField('dept', e.target.value)}
          />
        </Field>
      </div>

      <div ref={setFieldRef('role')}>
        <Field
          id={idFor('role')}
          label={t('form.fields.ownerRole')}
          hint={t('form.fields.ownerRoleHint')}
          error={errors.role}
        >
          <Select
            id={idFor('role')}
            value={value.role}
            error={!!errors.role}
            options={roleOptions}
            onChange={(e) => updateField('role', e.target.value)}
          />
        </Field>
      </div>

      {onRemove && (
        <div className="flex items-end pb-[6px]">
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('form.removeOwner')}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-text-3',
              'hover:border-danger/40 hover:bg-danger-soft/40 hover:text-danger'
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
