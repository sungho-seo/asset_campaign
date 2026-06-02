import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cloud,
  Plus,
  ServerCog,
  ShieldCheck,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import type { Asset, AssetOwner, Owner } from '../../types/domain';
import {
  DATA_CLASS_VALUES,
  ENVIRONMENT_VALUES,
  MAX_ADDITIONAL_OWNERS,
  MAX_OWNERS_PER_ASSET,
  SECURITY_VALUES,
  toAssetOwner,
} from '../../types/domain';
import {
  assetFormSchema,
  emptyCloud,
  type AssetFormValues,
} from '../../lib/validation';
import { Input } from '../common/Input';
import { ToggleGroup } from '../common/ToggleGroup';
import { Button } from '../common/Button';
import { Field } from './Field';
import { IPList } from './IPList';
import { Select } from './Select';
import { SelectWithCustom } from './SelectWithCustom';
import { OwnerRow, type OwnerRowField } from './OwnerRow';
import { ValidationBanner, type ValidationError } from './ValidationBanner';
import { ASSET_TYPE_OPTIONS, CSP_OPTIONS, OS_OPTIONS } from '../../lib/mock';
import { cn } from '../../lib/cn';

export type AssetFormHandle = {
  validateAndGet: () => AssetFormValues | null;
  setValues: (next: AssetFormValues) => void;
};

type AssetFormProps = {
  mode: 'edit' | 'new';
  initial: AssetFormValues;
  currentUser: Owner;
  ownerAutoFilled?: boolean;
  className?: string;
};

// 정적 필드의 i18n 라벨 키 매핑. 추가 담당자 필드(additionalOwners.N.*)는
// ValidationBanner 라벨 구성 시 동적으로 합성.
const FIELD_LABEL_KEY = {
  'owner.name': 'form.fields.ownerName',
  'owner.email': 'form.fields.ownerEmail',
  'owner.dept': 'form.fields.ownerDept',
  'owner.role': 'form.fields.ownerRole',
  assetType: 'form.fields.assetType',
  hostname: 'form.fields.hostname',
  purpose: 'form.fields.purpose',
  ips: 'form.fields.ips',
  internet: 'form.fields.internet',
  domain: 'form.fields.domain',
  os: 'form.fields.os',
  osVersion: 'form.fields.osVersion',
  location: 'form.fields.location',
  security: 'form.fields.security',
  'cloud.csp': 'form.fields.cspProvider',
  'cloud.accountId': 'form.fields.accountId',
  'cloud.environment': 'form.fields.environment',
  'cloud.dataClass': 'form.fields.dataClass',
} as const;

type StaticFieldKey = keyof typeof FIELD_LABEL_KEY;
// 동적 키 (additionalOwners.0.name 등)도 같이 다루기 위해 string으로 확장.
type FieldKey = StaticFieldKey | string;

// "additionalOwners.0.email" → '추가 담당자 1 · 이메일'
function parseAdditionalOwnerKey(key: string): { idx: number; field: OwnerRowField } | null {
  const m = /^additionalOwners\.(\d+)\.(name|email|dept|role)$/.exec(key);
  if (!m) return null;
  return { idx: Number(m[1]), field: m[2] as OwnerRowField };
}

// CSP별 계정 ID placeholder — CSP 이름 자체는 키가 아니라 그대로 표시 (Amazon/Azure 등 고유명사)
const CSP_ACCOUNT_ID_PLACEHOLDER: Record<string, string> = {
  AWS: 'Account ID (e.g. 123456789012)',
  Azure: 'Subscription ID',
  GCP: 'Project ID',
  NCP: 'Account/Project ID',
};
function accountIdPlaceholder(csp: string, fallback: string): string {
  return CSP_ACCOUNT_ID_PLACEHOLDER[csp] ?? fallback;
}

type SectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

function SectionHeader({ icon: Icon, title, subtitle, right }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-brand-soft/45 via-bg-soft/30 to-white px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-[12.5px] font-semibold tracking-tightish text-text">
          {title}
        </h3>
        {subtitle && (
          <span className="truncate text-[11px] text-text-3">{subtitle}</span>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

export function emptyValues(currentUser: Owner): AssetFormValues {
  return {
    owner: toAssetOwner(currentUser),
    additionalOwners: [],
    assetType: '',
    hostname: '',
    purpose: '',
    ips: [''],
    internet: null,
    domain: '',
    os: '',
    osVersion: '',
    location: '',
    security: '',
    cloud: emptyCloud(),
  };
}

export function valuesFromAsset(asset: Asset, currentUser: Owner): AssetFormValues {
  return {
    owner: asset.owner ?? toAssetOwner(currentUser),
    additionalOwners: asset.additionalOwners.map((o) => ({ ...o })),
    assetType: asset.assetType,
    hostname: asset.hostname,
    purpose: asset.purpose,
    ips: asset.ips.length ? [...asset.ips] : [''],
    internet: asset.internet,
    domain: asset.domain,
    os: asset.os,
    osVersion: asset.osVersion,
    location: asset.location,
    security: asset.security,
    cloud: asset.cloud ? { ...asset.cloud } : emptyCloud(),
  };
}

export const AssetForm = forwardRef<AssetFormHandle, AssetFormProps>(function AssetForm(
  { mode, initial, currentUser, ownerAutoFilled = false, className },
  ref
) {
  const { t } = useTranslation();
  // errors map은 i18n 키만 저장. 출력 시 t()로 번역해 언어 토글에 즉시 반응하도록.
  const tr = (k: string | undefined) => (k ? t(k) : undefined);
  // 드롭다운 옵션 라벨 번역. 저장 값은 그대로 두고 표시 라벨만 한/영 전환.
  // 알려지지 않은 값(직접입력 케이스 등)은 그대로 반환.
  const optionLabel = (category: 'assetType' | 'security' | 'dataClass') =>
    (v: string): string =>
      v ? t(`options.${category}.${v}`, { defaultValue: v }) : v;

  const [values, setValues] = useState<AssetFormValues>(initial);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 담당자 자동 채움 상태 — true이면 첫 클릭 시 owner 3필드를 한꺼번에 비움 (OwnerRow가 처리)
  const [ownerIsAutoFilled, setOwnerIsAutoFilled] = useState(ownerAutoFilled);
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({});

  useEffect(() => {
    setValues(initial);
    setTouched({});
    setErrors({});
    setOwnerIsAutoFilled(ownerAutoFilled);
  }, [initial, ownerAutoFilled]);

  useImperativeHandle(ref, () => ({
    validateAndGet: () => {
      const result = assetFormSchema.safeParse(values);
      if (result.success) {
        setErrors({});
        return result.data;
      }
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!next[path]) next[path] = issue.message;
      }
      setErrors(next);
      return null;
    },
    setValues: (next) => setValues(next),
  }));

  const markTouched = (key: FieldKey) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((e) => {
      if (!e[key]) return e;
      const { [key]: _omit, ...rest } = e;
      return rest;
    });
  };

  const validationErrors: ValidationError[] = useMemo(() => {
    return Object.keys(errors).map((key) => {
      const additional = parseAdditionalOwnerKey(key);
      // 추가 담당자 행 에러는 라벨에 "추가 담당자 N · 필드명" 컨텍스트 추가 (banner의 메시지만으로 어느 행인지 불분명한 문제 해소).
      const label = additional
        ? `${t('form.additionalOwnersTitle')} ${additional.idx + 1} · ${t(
            FIELD_LABEL_KEY[`owner.${additional.field}` as StaticFieldKey]
          )} — ${t(errors[key])}`
        : t(errors[key]);
      return {
        key,
        label,
        onClick: () => {
          const el = fieldRefs.current[key];
          if (!el) return;
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const focusable =
            el.querySelector<HTMLElement>('input,select,button[role="radio"]') ?? el;
          focusable.focus();
          el.classList.add('ring-2', 'ring-danger', 'ring-offset-2');
          window.setTimeout(() => {
            el.classList.remove('ring-2', 'ring-danger', 'ring-offset-2');
          }, 1200);
        },
      };
    });
  }, [errors, t]);

  const setField = <K extends keyof AssetFormValues>(
    key: K,
    v: AssetFormValues[K]
  ) => {
    setValues((s) => ({ ...s, [key]: v }));
  };

  const setCloudField = (key: keyof AssetFormValues['cloud'], v: string) => {
    setValues((s) => ({ ...s, cloud: { ...s.cloud, [key]: v } }));
  };

  const showCloud = values.assetType === '클라우드';
  const allowMultipleIPs = showCloud;

  // 자산 내 모든 행에서 현재 사용 중인 역할 코드 집합 — 한 행에서 takenRoles로 사용.
  // 본인 역할은 OwnerRow에서 별도로 disabled 해제 처리.
  const usedRoles = useMemo(() => {
    const s = new Set<string>();
    if (values.owner.role) s.add(values.owner.role);
    for (const o of values.additionalOwners) if (o.role) s.add(o.role);
    return s;
  }, [values.owner.role, values.additionalOwners]);

  const isEmpty = (v: unknown) => v === '' || v === null || v === undefined;
  const flag = (key: FieldKey, v: unknown) =>
    mode === 'new' && !touched[key] && isEmpty(v);

  const setRef = (key: FieldKey) => (el: HTMLDivElement | null) => {
    fieldRefs.current[key] = el;
  };

  // OwnerRow가 4개 필드의 ref를 자체적으로 등록 → 부모는 key prefix를 합쳐 fieldRefs에 저장.
  const ownerRowRefRegistrar =
    (prefix: 'owner' | `additionalOwners.${number}`) =>
    (field: OwnerRowField, el: HTMLDivElement | null) => {
      fieldRefs.current[`${prefix}.${field}`] = el;
    };

  const ownerRowErrors = (prefix: 'owner' | `additionalOwners.${number}`) => ({
    name: tr(errors[`${prefix}.name`]),
    email: tr(errors[`${prefix}.email`]),
    dept: tr(errors[`${prefix}.dept`]),
    role: tr(errors[`${prefix}.role`]),
  });

  // OwnerRow가 통보하는 필드 변경 → touched/errors 갱신
  const ownerRowFieldChange =
    (prefix: 'owner' | `additionalOwners.${number}`) => (field: OwnerRowField) => {
      markTouched(`${prefix}.${field}`);
    };

  const addAdditionalOwner = () => {
    setValues((s) => {
      // 한도 초과 시 no-op (UI에서 버튼이 disabled되지만 키보드/엣지 케이스 방어).
      if (s.additionalOwners.length >= MAX_ADDITIONAL_OWNERS) return s;
      return {
        ...s,
        additionalOwners: [
          ...s.additionalOwners,
          { name: '', email: '', dept: '', role: '' } as AssetOwner,
        ],
      };
    });
  };

  const removeAdditionalOwner = (idx: number) => {
    setValues((s) => ({
      ...s,
      additionalOwners: s.additionalOwners.filter((_, i) => i !== idx),
    }));
    // 해당 행과 그 이후 행의 에러/touched 키도 정리 — 인덱스 변경으로 stale 데이터가 남을 수 있음.
    setErrors((e) => {
      const next: Record<string, string> = {};
      for (const k of Object.keys(e)) {
        const parsed = parseAdditionalOwnerKey(k);
        if (!parsed) {
          next[k] = e[k];
          continue;
        }
        if (parsed.idx < idx) next[k] = e[k];
        else if (parsed.idx > idx)
          next[`additionalOwners.${parsed.idx - 1}.${parsed.field}`] = e[k];
        // parsed.idx === idx → drop
      }
      return next;
    });
  };

  const updateAdditionalOwner = (idx: number, next: AssetOwner) => {
    setValues((s) => ({
      ...s,
      additionalOwners: s.additionalOwners.map((o, i) => (i === idx ? next : o)),
    }));
  };

  return (
    <div className={cn('space-y-5', className)}>
      {validationErrors.length > 0 && <ValidationBanner errors={validationErrors} />}

      {/* 담당자 블록 */}
      <section className="relative overflow-hidden rounded-lg border border-line bg-white">
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-brand" />
        <SectionHeader
          icon={UserCircle2}
          title={t('form.sections.owner')}
          right={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // 내 정보로 채우기: primary만 교체, 역할은 보존
                setValues((s) => ({ ...s, owner: toAssetOwner(currentUser, s.owner.role) }));
                setTouched((t) => ({
                  ...t,
                  'owner.name': true,
                  'owner.email': true,
                  'owner.dept': true,
                }));
                setErrors((e) => {
                  const {
                    'owner.name': _a,
                    'owner.email': _b,
                    'owner.dept': _c,
                    ...rest
                  } = e;
                  return rest;
                });
                setOwnerIsAutoFilled(false);
              }}
            >
              {t('form.fillMyInfo')}
            </Button>
          }
        />
        <div className="space-y-4 p-4">
          <OwnerRow
            rowId="owner"
            value={values.owner}
            onChange={(next) => setValues((s) => ({ ...s, owner: next }))}
            required
            autoFilled={ownerIsAutoFilled}
            onAutoFilledConsumed={() => setOwnerIsAutoFilled(false)}
            emptyFlag={(f) =>
              f === 'role'
                ? false
                : flag(`owner.${f}`, values.owner[f])
            }
            registerRef={ownerRowRefRegistrar('owner')}
            errors={ownerRowErrors('owner')}
            onFieldChange={ownerRowFieldChange('owner')}
            takenRoles={usedRoles}
          />

          {values.additionalOwners.length > 0 && (
            <div className="space-y-3 border-t border-line pt-4">
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-text-3">
                {t('form.additionalOwnersTitle')}
              </div>
              {values.additionalOwners.map((o, idx) => (
                <OwnerRow
                  key={idx}
                  rowId={`additionalOwners.${idx}`}
                  value={o}
                  onChange={(next) => updateAdditionalOwner(idx, next)}
                  required
                  emptyFlag={(f) =>
                    f === 'role'
                      ? false
                      : flag(`additionalOwners.${idx}.${f}`, o[f])
                  }
                  registerRef={ownerRowRefRegistrar(`additionalOwners.${idx}` as const)}
                  errors={ownerRowErrors(`additionalOwners.${idx}` as const)}
                  onFieldChange={ownerRowFieldChange(`additionalOwners.${idx}` as const)}
                  onRemove={() => removeAdditionalOwner(idx)}
                  takenRoles={usedRoles}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addAdditionalOwner}
              disabled={values.additionalOwners.length >= MAX_ADDITIONAL_OWNERS}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border border-dashed border-line bg-bg-soft/30 px-3 py-1.5 text-[12px] font-medium text-text-2',
                'hover:border-brand/40 hover:bg-brand-soft/30 hover:text-brand',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:bg-bg-soft/30 disabled:hover:text-text-2'
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('form.addOwner')}
            </button>
            <span className="font-mono text-[11px] text-text-3">
              {t('form.addOwnerLimit', {
                count: values.additionalOwners.length + 1,
                max: MAX_OWNERS_PER_ASSET,
              })}
            </span>
          </div>
        </div>
      </section>

      {/* 자산 정보 */}
      <section className="relative overflow-hidden rounded-lg border border-line bg-white">
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-brand" />
        <SectionHeader icon={ServerCog} title={t('form.sections.asset')} />
        <div className="space-y-4 p-4">

        <div className="grid grid-cols-2 gap-3">
          <div ref={setRef('assetType')}>
            <Field id="assetType" label={t(FIELD_LABEL_KEY.assetType)} error={tr(errors.assetType)} hint={t('form.fields.assetTypeHint')}>
              <SelectWithCustom
                id="assetType"
                value={values.assetType}
                emptyFlag={flag('assetType', values.assetType)}
                error={!!errors.assetType}
                placeholder={t('form.selectPlaceholder')}
                options={ASSET_TYPE_OPTIONS}
                labelFor={optionLabel('assetType')}
                onChange={(v) => {
                  // 비클라우드로 전환 시 IP를 1개로 정리. 비어 있던 추가 행이라도 깔끔히 제거.
                  setValues((s) => {
                    const becomesSingleIp = v !== '클라우드' && s.ips.length > 1;
                    return {
                      ...s,
                      assetType: v,
                      ips: becomesSingleIp ? [s.ips[0] ?? ''] : s.ips,
                    };
                  });
                  markTouched('assetType');
                }}
              />
            </Field>
          </div>
          <div ref={setRef('hostname')}>
            <Field id="hostname" label={t(FIELD_LABEL_KEY.hostname)} required error={tr(errors.hostname)}>
              <Input
                id="hostname"
                variant="mono"
                value={values.hostname}
                emptyFlag={flag('hostname', values.hostname)}
                error={!!errors.hostname}
                onChange={(e) => {
                  setField('hostname', e.target.value);
                  markTouched('hostname');
                }}
              />
            </Field>
          </div>
        </div>

        <div ref={setRef('purpose')}>
          <Field
            id="purpose"
            label={t(FIELD_LABEL_KEY.purpose)}
            hint={t('form.fields.purposeHint')}
            error={tr(errors.purpose)}
          >
            <Input
              id="purpose"
              value={values.purpose}
              emptyFlag={flag('purpose', values.purpose)}
              error={!!errors.purpose}
              onChange={(e) => {
                setField('purpose', e.target.value);
                markTouched('purpose');
              }}
            />
          </Field>
        </div>

        <div ref={setRef('ips')}>
          <Field
            id="ips-0"
            label={t(FIELD_LABEL_KEY.ips)}
            required
            hint={t(allowMultipleIPs ? 'form.fields.ipsHint' : 'form.fields.ipsHintSingle')}
            error={tr(errors.ips)}
          >
            <IPList
              inputId="ips-0"
              values={values.ips}
              showErrors={!!errors.ips || touched.ips === true}
              allowMultiple={allowMultipleIPs}
              onChange={(v) => {
                setField('ips', v);
                markTouched('ips');
              }}
            />
            <div className="mt-2 rounded-md border border-line bg-bg-soft/50 px-3 py-2 text-[11.5px] leading-relaxed text-text-2">
              <div>
                <span className="font-medium text-text">{t('form.fields.ipDetail.title')}</span>
                <span className="text-text-3"> · </span>
                {t('form.fields.ipDetail.titleValue')}
              </div>
              <div className="mt-1">
                <span className="font-medium text-text">{t('form.fields.ipDetail.note')}</span>
                <span className="text-text-3"> · </span>
                {t('form.fields.ipDetail.noteValue')}
              </div>
            </div>
          </Field>
        </div>

        <div ref={setRef('domain')}>
          <Field
            id="domain"
            label={t(FIELD_LABEL_KEY.domain)}
            hint={t('form.fields.domainHint')}
            error={tr(errors.domain)}
          >
            <Input
              id="domain"
              variant="mono"
              placeholder="lge.com"
              value={values.domain}
              emptyFlag={flag('domain', values.domain)}
              error={!!errors.domain}
              onChange={(e) => {
                setField('domain', e.target.value);
                markTouched('domain');
              }}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div ref={setRef('os')}>
            <Field id="os" label={t(FIELD_LABEL_KEY.os)} required error={tr(errors.os)}>
              <SelectWithCustom
                id="os"
                value={values.os}
                emptyFlag={flag('os', values.os)}
                error={!!errors.os}
                placeholder={t('form.selectPlaceholder')}
                options={OS_OPTIONS}
                onChange={(v) => {
                  setField('os', v);
                  markTouched('os');
                }}
              />
            </Field>
          </div>
          <div ref={setRef('osVersion')}>
            <Field id="osVersion" label={t(FIELD_LABEL_KEY.osVersion)} required error={tr(errors.osVersion)}>
              <Input
                id="osVersion"
                variant="mono"
                value={values.osVersion}
                emptyFlag={flag('osVersion', values.osVersion)}
                error={!!errors.osVersion}
                onChange={(e) => {
                  setField('osVersion', e.target.value);
                  markTouched('osVersion');
                }}
              />
            </Field>
          </div>
        </div>

        <div ref={setRef('location')}>
          <Field
            id="location"
            label={t(FIELD_LABEL_KEY.location)}
            hint={t('form.fields.locationHint')}
            error={tr(errors.location)}
          >
            <Input
              id="location"
              value={values.location}
              emptyFlag={flag('location', values.location)}
              error={!!errors.location}
              onChange={(e) => {
                setField('location', e.target.value);
                markTouched('location');
              }}
            />
          </Field>
        </div>
        </div>
      </section>

      {/* 클라우드 추가 항목 — assetType === '클라우드' 일 때만 노출 */}
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          showCloud ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
        aria-hidden={!showCloud}
      >
        <div className="overflow-hidden">
          <section className="relative overflow-hidden rounded-lg border border-line bg-white">
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-brand" />
            <SectionHeader
              icon={Cloud}
              title={t('form.sections.cloud')}
              subtitle={t('form.sections.cloudHint')}
            />
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div ref={setRef('cloud.csp')}>
                  <Field
                    id="cloud.csp"
                    label={t(FIELD_LABEL_KEY['cloud.csp'])}
                    required={showCloud}
                    error={tr(errors['cloud.csp'])}
                  >
                    <SelectWithCustom
                      id="cloud.csp"
                      value={values.cloud.csp}
                      emptyFlag={flag('cloud.csp', values.cloud.csp)}
                      error={!!errors['cloud.csp']}
                      placeholder={t('form.selectPlaceholder')}
                      options={CSP_OPTIONS}
                      onChange={(v) => {
                        setCloudField('csp', v);
                        markTouched('cloud.csp');
                      }}
                    />
                  </Field>
                </div>
                <div ref={setRef('cloud.accountId')}>
                  <Field
                    id="cloud.accountId"
                    label={t(FIELD_LABEL_KEY['cloud.accountId'])}
                    required={showCloud}
                    error={tr(errors['cloud.accountId'])}
                  >
                    <Input
                      id="cloud.accountId"
                      variant="mono"
                      placeholder={accountIdPlaceholder(values.cloud.csp, t(FIELD_LABEL_KEY['cloud.accountId']))}
                      value={values.cloud.accountId}
                      emptyFlag={flag('cloud.accountId', values.cloud.accountId)}
                      error={!!errors['cloud.accountId']}
                      onChange={(e) => {
                        setCloudField('accountId', e.target.value);
                        markTouched('cloud.accountId');
                      }}
                    />
                  </Field>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div ref={setRef('cloud.environment')}>
                  <Field
                    id="cloud.environment"
                    label={t(FIELD_LABEL_KEY['cloud.environment'])}
                    required={showCloud}
                    error={tr(errors['cloud.environment'])}
                  >
                    <Select
                      id="cloud.environment"
                      value={values.cloud.environment}
                      emptyFlag={flag('cloud.environment', values.cloud.environment)}
                      error={!!errors['cloud.environment']}
                      placeholder={t('form.selectPlaceholder')}
                      options={ENVIRONMENT_VALUES as readonly string[] as string[]}
                      onChange={(e) => {
                        setCloudField('environment', e.target.value);
                        markTouched('cloud.environment');
                      }}
                    />
                  </Field>
                </div>
                <div ref={setRef('cloud.dataClass')}>
                  <Field
                    id="cloud.dataClass"
                    label={t(FIELD_LABEL_KEY['cloud.dataClass'])}
                    error={tr(errors['cloud.dataClass'])}
                  >
                    <Select
                      id="cloud.dataClass"
                      value={values.cloud.dataClass}
                      emptyFlag={flag('cloud.dataClass', values.cloud.dataClass)}
                      error={!!errors['cloud.dataClass']}
                      placeholder={t('form.selectPlaceholder')}
                      options={DATA_CLASS_VALUES.map((v) => ({ value: v, label: optionLabel('dataClass')(v) }))}
                      onChange={(e) => {
                        setCloudField('dataClass', e.target.value);
                        markTouched('cloud.dataClass');
                      }}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 보안 옵션 */}
      <section className="relative overflow-hidden rounded-lg border border-line bg-white">
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-brand" />
        <SectionHeader icon={ShieldCheck} title={t('form.sections.security')} />
        <div className="grid grid-cols-2 gap-3 p-4">
          <div ref={setRef('internet')}>
            <Field label={t(FIELD_LABEL_KEY.internet)} error={tr(errors.internet)}>
              <ToggleGroup<'yes' | 'no'>
                name="internet"
                value={values.internet}
                error={!!errors.internet}
                onChange={(v) => {
                  setField('internet', v);
                  markTouched('internet');
                }}
                options={[
                  { value: 'yes', label: t('form.toggle.yes') },
                  { value: 'no', label: t('form.toggle.no') },
                ]}
              />
            </Field>
          </div>
          <div ref={setRef('security')}>
            <Field
              id="security"
              label={t(FIELD_LABEL_KEY.security)}
              hint={t('form.fields.securityHint')}
              error={tr(errors.security)}
            >
              <Select
                id="security"
                value={values.security}
                emptyFlag={flag('security', values.security)}
                error={!!errors.security}
                placeholder={t('form.selectPlaceholder')}
                options={SECURITY_VALUES.map((v) => ({ value: v, label: optionLabel('security')(v) }))}
                onChange={(e) => {
                  setField('security', e.target.value as AssetFormValues['security']);
                  markTouched('security');
                }}
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
});

// i18n 키만 반환. 사용처에서 useTranslation의 t()로 번역해 사용.
// 동적 키(additionalOwners.N.*)는 호출처에서 별도 처리.
export function fieldLabelKey(key: FieldKey): string | undefined {
  return FIELD_LABEL_KEY[key as StaticFieldKey];
}
