import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Cloud,
  ServerCog,
  ShieldCheck,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import type { Asset, Owner } from '../../types/domain';
import {
  DATA_CLASS_VALUES,
  ENVIRONMENT_VALUES,
  SECURITY_VALUES,
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
import { DirectoryDropdown } from './DirectoryDropdown';
import { ValidationBanner, type ValidationError } from './ValidationBanner';
import { ASSET_TYPE_OPTIONS, CSP_OPTIONS, OS_OPTIONS } from '../../lib/mock';
import { searchDirectory } from '../../lib/api';
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
  'security',
  'cloud.csp',
  'cloud.accountId',
  'cloud.environment',
  'cloud.dataClass',
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
  security: '보안 솔루션',
  'cloud.csp': '클라우드 제공자 (CSP)',
  'cloud.accountId': '계정 ID',
  'cloud.environment': '환경',
  'cloud.dataClass': '취급 데이터 등급',
};

// CSP별 계정 ID placeholder
const CSP_ACCOUNT_ID_PLACEHOLDER: Record<string, string> = {
  AWS: 'Account ID (예: 123456789012)',
  Azure: 'Subscription ID',
  GCP: 'Project ID',
  NCP: 'Account/Project ID',
};
function accountIdPlaceholder(csp: string): string {
  return CSP_ACCOUNT_ID_PLACEHOLDER[csp] ?? '계정 식별자';
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
    security: '',
    cloud: emptyCloud(),
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
    security: asset.security,
    cloud: asset.cloud ? { ...asset.cloud } : emptyCloud(),
  };
}

export const AssetForm = forwardRef<AssetFormHandle, AssetFormProps>(function AssetForm(
  { mode, initial, currentUser, ownerAutoFilled = false, className },
  ref
) {
  const [values, setValues] = useState<AssetFormValues>(initial);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  // 담당자 자동 채움 상태 — true이면 첫 클릭 시 owner 3필드를 한꺼번에 비움
  const [ownerIsAutoFilled, setOwnerIsAutoFilled] = useState(ownerAutoFilled);

  const handleNameFocus = () => {
    if (ownerIsAutoFilled) {
      setValues((s) => ({ ...s, owner: { name: '', email: '', dept: '' } }));
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
    }
  };
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({});

  // 담당자 이름 검색 (디렉토리에서 동명이인 찾기) — 타이핑 중 자동 검색
  const nameAnchorRef = useRef<HTMLDivElement | null>(null);
  const [dirOpen, setDirOpen] = useState(false);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirResults, setDirResults] = useState<Owner[]>([]);
  const dirDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirRequestSeq = useRef(0); // race condition 방지용 일련번호

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
      // 늦게 도착한 응답은 무시 (사용자가 그 사이 더 타이핑)
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

  const pickDirectoryPerson = (p: Owner) => {
    // 진행 중인 디바운스/응답 무효화
    if (dirDebounceRef.current) clearTimeout(dirDebounceRef.current);
    dirRequestSeq.current++;
    setValues((s) => ({ ...s, owner: { ...p } }));
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
    setDirOpen(false);
  };

  useEffect(() => {
    setValues(initial);
    setTouched({});
    setErrors({});
    setDirOpen(false);
    setDirResults([]);
    setOwnerIsAutoFilled(ownerAutoFilled);
  }, [initial, ownerAutoFilled]);

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

  const setCloudField = (key: keyof AssetFormValues['cloud'], v: string) => {
    setValues((s) => ({ ...s, cloud: { ...s.cloud, [key]: v } }));
  };

  const showCloud = values.assetType === '클라우드';

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
                setOwnerIsAutoFilled(false);
              }}
            >
              내 정보로 채우기
            </Button>
          }
        />
        <div className="grid grid-cols-3 gap-3 p-4">
          <div
            ref={(el) => {
              setRef('owner.name')(el);
              nameAnchorRef.current = el;
            }}
          >
            <Field
              id="owner.name"
              label="담당자 이름"
              required
              hint="(타이핑하면 동명이인 자동 검색)"
              error={errors['owner.name']}
            >
              <Input
                id="owner.name"
                autoComplete="off"
                value={values.owner.name}
                emptyFlag={flag('owner.name', values.owner.name)}
                error={!!errors['owner.name']}
                onFocus={handleNameFocus}
                onClick={handleNameFocus}
                onChange={(e) => {
                  const next = e.target.value;
                  setOwnerField('name', next);
                  markTouched('owner.name');
                  setOwnerIsAutoFilled(false);
                  scheduleDirectorySearch(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // 폼 submit 방지 + 즉시 검색 (debounce 무시)
                    e.preventDefault();
                    if (dirDebounceRef.current) clearTimeout(dirDebounceRef.current);
                    void runDirectorySearch(values.owner.name);
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
              title="클라우드 추가 정보"
              subtitle="자산 유형이 클라우드일 때 필수"
            />
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div ref={setRef('cloud.csp')}>
                  <Field
                    id="cloud.csp"
                    label="클라우드 제공자 (CSP)"
                    required={showCloud}
                    error={errors['cloud.csp']}
                  >
                    <SelectWithCustom
                      id="cloud.csp"
                      value={values.cloud.csp}
                      emptyFlag={flag('cloud.csp', values.cloud.csp)}
                      error={!!errors['cloud.csp']}
                      placeholder="선택하세요"
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
                    label="계정 ID"
                    required={showCloud}
                    error={errors['cloud.accountId']}
                  >
                    <Input
                      id="cloud.accountId"
                      variant="mono"
                      placeholder={accountIdPlaceholder(values.cloud.csp)}
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
                    label="환경"
                    required={showCloud}
                    error={errors['cloud.environment']}
                  >
                    <Select
                      id="cloud.environment"
                      value={values.cloud.environment}
                      emptyFlag={flag('cloud.environment', values.cloud.environment)}
                      error={!!errors['cloud.environment']}
                      placeholder="선택하세요"
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
                    label="취급 데이터 등급"
                    error={errors['cloud.dataClass']}
                  >
                    <Select
                      id="cloud.dataClass"
                      value={values.cloud.dataClass}
                      emptyFlag={flag('cloud.dataClass', values.cloud.dataClass)}
                      error={!!errors['cloud.dataClass']}
                      placeholder="선택하세요"
                      options={DATA_CLASS_VALUES as readonly string[] as string[]}
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
        <SectionHeader icon={ShieldCheck} title="보안 옵션" />
        <div className="grid grid-cols-2 gap-3 p-4">
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
          <div ref={setRef('security')}>
            <Field
              id="security"
              label="보안 솔루션"
              hint="(설치된 보안 솔루션 종류)"
              error={errors.security}
            >
              <Select
                id="security"
                value={values.security}
                emptyFlag={flag('security', values.security)}
                error={!!errors.security}
                placeholder="선택하세요"
                options={SECURITY_VALUES as readonly string[] as string[]}
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

export function fieldLabel(key: FieldKey): string {
  return FIELD_LABEL[key];
}
