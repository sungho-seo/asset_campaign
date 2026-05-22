import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ServerCog, ShieldCheck, UserCircle2, type LucideIcon } from 'lucide-react';
import type { Asset, Owner } from '../../types/domain';
import {
  assetFormSchema,
  type AssetFormValues,
} from '../../lib/validation';
import { Input } from '../common/Input';
import { ToggleGroup } from '../common/ToggleGroup';
import { Button } from '../common/Button';
import { Field } from './Field';
import { IPList } from './IPList';
import { SelectWithCustom } from './SelectWithCustom';
import { ValidationBanner, type ValidationError } from './ValidationBanner';
import { ASSET_TYPE_OPTIONS, OS_OPTIONS } from '../../lib/mock';
import { cn } from '../../lib/cn';

export type AssetFormHandle = {
  validateAndGet: () => AssetFormValues | null;
  setValues: (next: AssetFormValues) => void;
};

type AssetFormProps = {
  mode: 'edit' | 'new';
  initial: AssetFormValues;
  currentUser: Owner;
  className?: string;
};

const FIELD_KEYS = [
  'owner.name',
  'owner.email',
  'owner.dept',
  'assetType',
  'hostname',
  'purpose',
  'ips',
  'internet',
  'domain',
  'os',
  'osVersion',
  'location',
  'antivirus',
  'edr',
] as const;

type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABEL: Record<FieldKey, string> = {
  'owner.name': '담당자 이름',
  'owner.email': '담당자 이메일',
  'owner.dept': '소속 조직 / 부서',
  assetType: '자산 유형',
  hostname: '자산명 (Hostname)',
  purpose: '사용목적 / 서비스명',
  ips: 'IP 주소',
  internet: '외부 접속 여부',
  domain: '도메인명',
  os: '운영체제',
  osVersion: '운영체제 버전',
  location: '자산 위치',
  antivirus: '백신 설치 여부',
  edr: 'EDR 설치 여부',
};

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
    owner: { ...currentUser },
    assetType: '',
    hostname: '',
    purpose: '',
    ips: [''],
    internet: null,
    domain: '',
    os: '',
    osVersion: '',
    location: '',
    antivirus: null,
    edr: null,
  };
}

export function valuesFromAsset(asset: Asset, currentUser: Owner): AssetFormValues {
  return {
    owner: asset.owner ?? { ...currentUser },
    assetType: asset.assetType,
    hostname: asset.hostname,
    purpose: asset.purpose,
    ips: asset.ips.length ? [...asset.ips] : [''],
    internet: asset.internet,
    domain: asset.domain,
    os: asset.os,
    osVersion: asset.osVersion,
    location: asset.location,
    antivirus: asset.antivirus,
    edr: asset.edr,
  };
}

export const AssetForm = forwardRef<AssetFormHandle, AssetFormProps>(function AssetForm(
  { mode, initial, currentUser, className },
  ref
) {
  const [values, setValues] = useState<AssetFormValues>(initial);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({});

  useEffect(() => {
    setValues(initial);
    setTouched({});
    setErrors({});
  }, [initial]);

  useImperativeHandle(ref, () => ({
    validateAndGet: () => {
      const result = assetFormSchema.safeParse(values);
      if (result.success) {
        setErrors({});
        return result.data;
      }
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') as FieldKey;
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
    return (Object.keys(errors) as FieldKey[]).map((key) => ({
      key,
      label: errors[key]!,
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
    }));
  }, [errors]);

  const setField = <K extends keyof AssetFormValues>(
    key: K,
    v: AssetFormValues[K]
  ) => {
    setValues((s) => ({ ...s, [key]: v }));
  };

  const setOwnerField = (key: keyof Owner, v: string) => {
    setValues((s) => ({ ...s, owner: { ...s.owner, [key]: v } }));
  };

  const isEmpty = (v: unknown) => v === '' || v === null || v === undefined;
  const flag = (key: FieldKey, v: unknown) =>
    mode === 'new' && !touched[key] && isEmpty(v);

  const setRef = (key: FieldKey) => (el: HTMLDivElement | null) => {
    fieldRefs.current[key] = el;
  };

  return (
    <div className={cn('space-y-5', className)}>
      {validationErrors.length > 0 && <ValidationBanner errors={validationErrors} />}

      {/* 담당자 블록 */}
      <section className="relative overflow-hidden rounded-lg border border-line bg-white">
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-brand" />
        <SectionHeader
          icon={UserCircle2}
          title="담당자"
          subtitle="SSO 정보 자동 입력 (수정 가능)"
          right={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setValues((s) => ({ ...s, owner: { ...currentUser } }));
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
              }}
            >
              내 정보로 채우기
            </Button>
          }
        />
        <div className="grid grid-cols-3 gap-3 p-4">
          <div ref={setRef('owner.name')}>
            <Field id="owner.name" label="담당자 이름" required error={errors['owner.name']}>
              <Input
                id="owner.name"
                value={values.owner.name}
                emptyFlag={flag('owner.name', values.owner.name)}
                error={!!errors['owner.name']}
                onChange={(e) => {
                  setOwnerField('name', e.target.value);
                  markTouched('owner.name');
                }}
              />
            </Field>
          </div>
          <div ref={setRef('owner.email')}>
            <Field id="owner.email" label="담당자 이메일" required error={errors['owner.email']}>
              <Input
                id="owner.email"
                type="email"
                value={values.owner.email}
                emptyFlag={flag('owner.email', values.owner.email)}
                error={!!errors['owner.email']}
                onChange={(e) => {
                  setOwnerField('email', e.target.value);
                  markTouched('owner.email');
                }}
              />
            </Field>
          </div>
          <div ref={setRef('owner.dept')}>
            <Field id="owner.dept" label="소속 조직 / 부서" required error={errors['owner.dept']}>
              <Input
                id="owner.dept"
                value={values.owner.dept}
                emptyFlag={flag('owner.dept', values.owner.dept)}
                error={!!errors['owner.dept']}
                onChange={(e) => {
                  setOwnerField('dept', e.target.value);
                  markTouched('owner.dept');
                }}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* 자산 정보 */}
      <section className="relative overflow-hidden rounded-lg border border-line bg-white">
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-brand" />
        <SectionHeader icon={ServerCog} title="자산 정보" />
        <div className="space-y-4 p-4">

        <div className="grid grid-cols-2 gap-3">
          <div ref={setRef('assetType')}>
            <Field id="assetType" label="자산 유형" error={errors.assetType} hint="(예: 온프레미스, 클라우드)">
              <SelectWithCustom
                id="assetType"
                value={values.assetType}
                emptyFlag={flag('assetType', values.assetType)}
                error={!!errors.assetType}
                placeholder="선택하세요"
                options={ASSET_TYPE_OPTIONS}
                onChange={(v) => {
                  setField('assetType', v);
                  markTouched('assetType');
                }}
              />
            </Field>
          </div>
          <div ref={setRef('hostname')}>
            <Field id="hostname" label="자산명 (Hostname)" required error={errors.hostname}>
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
            label="사용목적 / 서비스명"
            hint="(예: 근태입력시스템)"
            error={errors.purpose}
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
            label="IP 주소"
            required
            hint="(복수 등록 가능 / IPv4)"
            error={errors.ips}
          >
            <IPList
              inputId="ips-0"
              values={values.ips}
              showErrors={!!errors.ips || touched.ips === true}
              onChange={(v) => {
                setField('ips', v);
                markTouched('ips');
              }}
            />
            <div className="mt-2 rounded-md border border-line bg-bg-soft/50 px-3 py-2 text-[11.5px] leading-relaxed text-text-2">
              <div>
                <span className="font-medium text-text">대상</span>
                <span className="text-text-3"> · </span>
                리눅스 서버 내 VM, Docker 컨테이너 기반의 Web/WAS/DBMS 등
              </div>
              <div className="mt-1">
                <span className="font-medium text-text">요청사항</span>
                <span className="text-text-3"> · </span>
                하나의 서버에 여러 개의 IP가 할당되어 있는 경우, 누락 없이 모든 IP를 입력해 주세요.
              </div>
            </div>
          </Field>
        </div>

        <div ref={setRef('domain')}>
          <Field
            id="domain"
            label="도메인명"
            hint="(예: lge.com)"
            error={errors.domain}
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
            <Field id="os" label="운영체제" required error={errors.os}>
              <SelectWithCustom
                id="os"
                value={values.os}
                emptyFlag={flag('os', values.os)}
                error={!!errors.os}
                placeholder="선택하세요"
                options={OS_OPTIONS}
                onChange={(v) => {
                  setField('os', v);
                  markTouched('os');
                }}
              />
            </Field>
          </div>
          <div ref={setRef('osVersion')}>
            <Field id="osVersion" label="운영체제 버전" required error={errors.osVersion}>
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
            label="자산 위치"
            hint="(예: 서울 마곡 LG사이언스파크 R&D본관 5층 521호)"
            error={errors.location}
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

      {/* 보안 옵션 */}
      <section className="relative overflow-hidden rounded-lg border border-line bg-white">
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-brand" />
        <SectionHeader icon={ShieldCheck} title="보안 옵션" />
        <div className="grid grid-cols-3 gap-3 p-4">
          <div ref={setRef('internet')}>
            <Field label="외부 접속 여부" error={errors.internet}>
              <ToggleGroup<'yes' | 'no'>
                name="internet"
                value={values.internet}
                error={!!errors.internet}
                onChange={(v) => {
                  setField('internet', v);
                  markTouched('internet');
                }}
                options={[
                  { value: 'yes', label: '예' },
                  { value: 'no', label: '아니오' },
                ]}
              />
            </Field>
          </div>
          <div ref={setRef('antivirus')}>
            <Field label="백신 설치 여부" error={errors.antivirus}>
              <ToggleGroup<'yes' | 'no'>
                name="antivirus"
                value={values.antivirus}
                error={!!errors.antivirus}
                onChange={(v) => {
                  setField('antivirus', v);
                  markTouched('antivirus');
                }}
                options={[
                  { value: 'yes', label: '예' },
                  { value: 'no', label: '아니오' },
                ]}
              />
            </Field>
          </div>
          <div ref={setRef('edr')}>
            <Field label="EDR 설치 여부" error={errors.edr}>
              <ToggleGroup<'yes' | 'no'>
                name="edr"
                value={values.edr}
                error={!!errors.edr}
                onChange={(v) => {
                  setField('edr', v);
                  markTouched('edr');
                }}
                options={[
                  { value: 'yes', label: '예' },
                  { value: 'no', label: '아니오' },
                ]}
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
});

export function fieldLabel(key: FieldKey): string {
  return FIELD_LABEL[key];
}
