import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { UserCircle2 } from 'lucide-react';
import type { Asset, Owner } from '../../types/domain';
import {
  assetFormSchema,
  type AssetFormValues,
} from '../../lib/validation';
import { Input } from '../common/Input';
import { ToggleGroup } from '../common/ToggleGroup';
import { Button } from '../common/Button';
import { Field } from './Field';
import { Select } from './Select';
import { IPList } from './IPList';
import { ValidationBanner, type ValidationError } from './ValidationBanner';
import { LOCATION_OPTIONS, OS_OPTIONS } from '../../lib/mock';
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
  'hostname',
  'domain',
  'ips',
  'os',
  'osVersion',
  'location',
  'internet',
  'antivirus',
  'edr',
] as const;

type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABEL: Record<FieldKey, string> = {
  'owner.name': '담당자 이름',
  'owner.email': '담당자 이메일',
  'owner.dept': '담당자 부서',
  hostname: '자산명',
  domain: '도메인',
  ips: 'IP 주소',
  os: '운영체제',
  osVersion: 'OS 버전',
  location: '사업장',
  internet: '인터넷 접속',
  antivirus: '백신',
  edr: 'EDR',
};

export function emptyValues(): AssetFormValues {
  return {
    owner: { name: '', email: '', dept: '' },
    hostname: '',
    domain: '',
    ips: [''],
    os: '',
    osVersion: '',
    location: '',
    internet: '' as AssetFormValues['internet'],
    antivirus: '' as AssetFormValues['antivirus'],
    edr: '' as AssetFormValues['edr'],
  };
}

export function valuesFromAsset(asset: Asset): AssetFormValues {
  return {
    owner: asset.owner ?? { name: '', email: '', dept: '' },
    hostname: asset.hostname,
    domain: asset.domain,
    ips: asset.ips.length ? [...asset.ips] : [''],
    os: asset.os,
    osVersion: asset.osVersion,
    location: asset.location,
    internet: asset.internet,
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
      {validationErrors.length > 0 && (
        <ValidationBanner errors={validationErrors} />
      )}

      {/* 담당자 블록 */}
      <section className="rounded-lg border border-line bg-bg-soft/40">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <UserCircle2 className="h-3.5 w-3.5 text-text-3" />
            <h3 className="text-[12.5px] font-medium text-text">담당자</h3>
          </div>
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
                const { 'owner.name': _a, 'owner.email': _b, 'owner.dept': _c, ...rest } = e;
                return rest;
              });
            }}
          >
            내 정보로 채우기
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          <div ref={setRef('owner.name')}>
            <Field id="owner.name" label="이름" required error={errors['owner.name']}>
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
            <Field id="owner.email" label="이메일" required error={errors['owner.email']}>
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
            <Field id="owner.dept" label="부서" required error={errors['owner.dept']}>
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

      {/* 자산 기본 정보 */}
      <section className="space-y-4">
        <h3 className="text-[12.5px] font-medium text-text-2">자산 정보</h3>
        <div className="grid grid-cols-2 gap-3">
          <div ref={setRef('hostname')}>
            <Field id="hostname" label="자산명 (Host Name)" required error={errors.hostname}>
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
          <div ref={setRef('domain')}>
            <Field id="domain" label="도메인" required error={errors.domain}>
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
        </div>

        <div ref={setRef('ips')}>
          <Field
            id="ips-0"
            label="IP 주소"
            required
            hint="(복수 등록 가능)"
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
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div ref={setRef('os')}>
            <Field id="os" label="운영체제" required error={errors.os}>
              <Select
                id="os"
                value={values.os}
                emptyFlag={flag('os', values.os)}
                error={!!errors.os}
                placeholder="선택하세요"
                options={OS_OPTIONS}
                onChange={(e) => {
                  setField('os', e.target.value);
                  markTouched('os');
                }}
              />
            </Field>
          </div>
          <div ref={setRef('osVersion')}>
            <Field id="osVersion" label="OS 버전" required error={errors.osVersion}>
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
          <Field id="location" label="사업장 / 서버 위치" required error={errors.location}>
            <Select
              id="location"
              value={values.location}
              emptyFlag={flag('location', values.location)}
              error={!!errors.location}
              placeholder="선택하세요"
              options={LOCATION_OPTIONS}
              onChange={(e) => {
                setField('location', e.target.value);
                markTouched('location');
              }}
            />
          </Field>
        </div>
      </section>

      {/* 보안 옵션 */}
      <section className="space-y-4">
        <h3 className="text-[12.5px] font-medium text-text-2">보안 옵션</h3>
        <div ref={setRef('internet')}>
          <Field label="인터넷 접속 (외부)" required error={errors.internet}>
            <ToggleGroup<'yes' | 'no'>
              name="internet"
              value={values.internet || null}
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
          <Field label="백신 설치" required error={errors.antivirus}>
            <ToggleGroup<'installed' | 'not-installed' | 'na'>
              name="antivirus"
              value={values.antivirus || null}
              error={!!errors.antivirus}
              onChange={(v) => {
                setField('antivirus', v);
                markTouched('antivirus');
              }}
              options={[
                { value: 'installed', label: '설치됨' },
                { value: 'not-installed', label: '미설치' },
                { value: 'na', label: '해당없음' },
              ]}
            />
          </Field>
        </div>
        <div ref={setRef('edr')}>
          <Field label="EDR 설치" required error={errors.edr}>
            <ToggleGroup<'installed' | 'not-installed' | 'na'>
              name="edr"
              value={values.edr || null}
              error={!!errors.edr}
              onChange={(v) => {
                setField('edr', v);
                markTouched('edr');
              }}
              options={[
                { value: 'installed', label: '설치됨' },
                { value: 'not-installed', label: '미설치' },
                { value: 'na', label: '해당없음' },
              ]}
            />
          </Field>
        </div>
      </section>
    </div>
  );
});

// Helper for label lookup (used by toast messages, etc.)
export function fieldLabel(key: FieldKey): string {
  return FIELD_LABEL[key];
}
