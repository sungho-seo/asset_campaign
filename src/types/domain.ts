export type ToggleYesNo = 'yes' | 'no';

export type Owner = {
  name: string;
  email: string;
  dept: string;
};

// PRD §6 — 자산-담당자 역할 분류 (자산별 컨텍스트, 선택 입력)
export const OWNER_ROLE_VALUES = [
  'service',
  'it',
  'sm',
  'server-primary',
  'server-backup',
  'other',
] as const;
export type OwnerRole = (typeof OWNER_ROLE_VALUES)[number];

// 자산에 바인딩된 담당자. 역할은 자산-담당자 관계에서만 의미 있음.
// 디렉토리(Owner)는 사람 자체이므로 role을 갖지 않는다.
export type AssetOwner = Owner & { role: string };

// 디렉토리에서 가져온 사람(Owner)을 자산에 바인딩할 때 사용.
// role은 자산-담당자 컨텍스트에서 부여되므로 기본값 빈 문자열.
export function toAssetOwner(o: Owner, role = ''): AssetOwner {
  return { name: o.name, email: o.email, dept: o.dept, role };
}

// PRD v5 §5.1 — 자산 유형
export const ASSET_TYPE_VALUES = ['온프레미스', '클라우드', '직접입력'] as const;

// PRD v5 §5.1 — 보안 솔루션 (antivirus + edr 통합)
export const SECURITY_VALUES = ['EPP', 'EDR', 'CWPP', '없음'] as const;
export type SecurityValue = (typeof SECURITY_VALUES)[number];

// PRD v5 §5.2 — 클라우드 자산 추가 항목
export const CSP_VALUES = ['AWS', 'Azure', 'GCP', 'NCP', '직접입력'] as const;
export const ENVIRONMENT_VALUES = ['Production', 'Staging', 'Development', 'Test'] as const;
export type Environment = (typeof ENVIRONMENT_VALUES)[number];
export const DATA_CLASS_VALUES = [
  '공개',
  '내부용',
  '기밀',
  '개인정보',
  '민감정보',
  '없음',
] as const;
export type DataClass = (typeof DATA_CLASS_VALUES)[number];

// 클라우드 자산 한정 정보. assetType === '클라우드' 일 때만 의미를 가짐.
// 런타임 검증은 assetFormSchema가 담당하며, 여기서는 폼 값과 정합되도록 string으로 둠.
// 허용 값은 ENVIRONMENT_VALUES / DATA_CLASS_VALUES 상수 참조.
export type CloudInfo = {
  csp: string;                         // AWS / Azure / GCP / NCP / 직접입력 자유 텍스트
  accountId: string;                   // CSP별 고유 식별자
  environment: string;                 // Environment | '' — UI에서만 좁힘
  dataClass: string;                   // DataClass | '' — UI에서만 좁힘
};

export type Asset = {
  id: string;
  assetType: string;                   // 자산 유형 (필수, [온프레미스/클라우드/직접입력])
  hostname: string;                    // 자산명 (필수)
  purpose: string;                     // 사용목적/서비스명 (선택)
  ips: string[];                       // IP 주소 (필수, 1+)
  internet: ToggleYesNo | null;        // 외부 접속 여부 (선택)
  domain: string;                      // 도메인명 (선택)
  os: string;                          // 운영체제 (필수)
  osVersion: string;                   // 운영체제 버전 (필수)
  location: string;                    // 자산 위치 (선택)
  security: string;                    // 보안 솔루션 (EPP/EDR/CWPP/없음/'')
  cloud: CloudInfo | null;             // 클라우드 자산 한정 (assetType !== '클라우드'면 null)
  owner: AssetOwner | null;            // primary 담당자 (UI에서 1명 필수)
  additionalOwners: AssetOwner[];      // 추가 담당자 0+
  qualysDetectedAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type SearchMode = 'all' | 'ip' | 'hostname' | 'owner' | 'email';

export type SearchResult = {
  total: number;
  items: Asset[];
  hasMore: boolean;
};

export type DashboardKPI = {
  totalAssets: number;
  identifiedCount: number;
  identifiedRate: number;
  uniqueVisitors: number;
  visitorDelta: number;
  editCount: number;
  newRegisterCount: number;
  abandonedCount: number;
  editDelta: number;
  newDelta: number;
  abandonedDelta: number;
};

export type ProgressPoint = {
  dPlus: number;
  date: string;
  pct: number;
};

export type HourlyHeatCell = {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  hour: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4 | 5;
};

export type DailyEditNew = {
  dPlus: number;
  edit: number;
  new: number;
};

export type IncidentKey =
  | 'dup-edit'
  | 'overwrite-5min'
  | 'ip-dup'
  | 'zero-to-new'
  | 'retry-abandon';

export type IncidentSummary = {
  key: IncidentKey;
  title: string;
  desc: string;
  count: string;
  recent24h: string;
  firstOccurrence: string;
};

export type IncidentRow = Record<string, unknown> & {
  id: string;
};

export type IncidentDetail = IncidentSummary & {
  columns: string[];
  rows: IncidentRow[];
};
