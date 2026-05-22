export type ToggleState = 'installed' | 'not-installed' | 'na';
export type InternetState = 'yes' | 'no';

export type Owner = {
  name: string;
  email: string;
  dept: string;
};

export type Asset = {
  id: string;
  hostname: string;
  domain: string;
  ips: string[];
  os: string;
  osVersion: string;
  location: string;
  internet: InternetState;
  antivirus: ToggleState;
  edr: ToggleState;
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
