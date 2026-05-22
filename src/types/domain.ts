export type ToggleYesNo = 'yes' | 'no';

export type Owner = {
  name: string;
  email: string;
  dept: string;
};

export type Asset = {
  id: string;
  assetType: string;                  // 자산 유형 (선택, 온프레미스/클라우드 등)
  hostname: string;                    // 자산명 (필수)
  purpose: string;                     // 사용목적/서비스명 (선택)
  ips: string[];                       // IP 주소 (필수, 1+)
  internet: ToggleYesNo | null;        // 외부 접속 여부 (선택)
  domain: string;                      // 도메인명 (선택)
  os: string;                          // 운영체제 (필수)
  osVersion: string;                   // 운영체제 버전 (필수)
  location: string;                    // 자산 위치 (선택, 사이트/건물 층/호수)
  antivirus: ToggleYesNo | null;       // 백신 설치 여부 (선택)
  edr: ToggleYesNo | null;             // EDR 설치 여부 (선택)
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
