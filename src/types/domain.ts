export type ToggleYesNo = 'yes' | 'no';

export type Owner = {
  name: string;
  email: string;
  dept: string;
};

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
// csp는 '직접입력' 선택 시 자유 텍스트가 들어갈 수 있으므로 string으로 둠.
export type CloudInfo = {
  csp: string;                         // AWS / Azure / GCP / NCP / (직접입력 자유 텍스트)
  accountId: string;                   // CSP별 고유 식별자
  environment: Environment | '';       // 미입력 상태는 ''
  dataClass: DataClass | '';           // 선택, 미입력 상태는 ''
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
  security: SecurityValue | '';        // 보안 솔루션 (선택, 미입력은 '')
  cloud: CloudInfo | null;             // 클라우드 자산 한정 (assetType !== '클라우드'면 null)
  owner: Owner | null;
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
