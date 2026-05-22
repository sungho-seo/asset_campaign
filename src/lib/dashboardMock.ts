import type {
  DailyEditNew,
  DashboardKPI,
  HourlyHeatCell,
  IncidentDetail,
  IncidentKey,
  ProgressPoint,
} from '../types/domain';

export const CAMPAIGN_START = '2026-05-14';
export const CAMPAIGN_DAYS = 30;
export const TODAY_DPLUS = 7;
export const TOTAL_ASSETS = 12847;

export const MOCK_KPI: DashboardKPI = {
  totalAssets: TOTAL_ASSETS,
  identifiedCount: 3006,
  identifiedRate: 23.4,
  uniqueVisitors: 2184,
  visitorDelta: 312,
  editCount: 2704,
  newRegisterCount: 302,
  abandonedCount: 9841,
  editDelta: 382,
  newDelta: 36,
  abandonedDelta: -418,
};

function dateOf(dPlus: number): string {
  const start = new Date(CAMPAIGN_START);
  start.setDate(start.getDate() + dPlus);
  return start.toISOString().slice(0, 10);
}

export const MOCK_PROGRESS: ProgressPoint[] = [
  { dPlus: 0, date: dateOf(0), pct: 2.1 },
  { dPlus: 1, date: dateOf(1), pct: 5.4 },
  { dPlus: 2, date: dateOf(2), pct: 7.9 },
  { dPlus: 3, date: dateOf(3), pct: 12.6 },
  { dPlus: 4, date: dateOf(4), pct: 16.5 },
  { dPlus: 5, date: dateOf(5), pct: 19.8 },
  { dPlus: 6, date: dateOf(6), pct: 21.7 },
  { dPlus: 7, date: dateOf(7), pct: 23.4 },
];

export const MOCK_DAILY: DailyEditNew[] = [
  { dPlus: 0, edit: 142, new: 18 },
  { dPlus: 1, edit: 268, new: 32 },
  { dPlus: 2, edit: 312, new: 41 },
  { dPlus: 3, edit: 384, new: 52 },
  { dPlus: 4, edit: 426, new: 48 },
  { dPlus: 5, edit: 388, new: 38 },
  { dPlus: 6, edit: 402, new: 37 },
  { dPlus: 7, edit: 382, new: 36 },
];

// Heatmap: 7일(월~일) × 24시간. 평일 점심/오후/퇴근 피크, 주말은 낮음.
export const MOCK_HEATMAP: HourlyHeatCell[] = (() => {
  const out: HourlyHeatCell[] = [];
  for (let d = 0; d < 7; d++) {
    const isWeekday = d < 5;
    for (let h = 0; h < 24; h++) {
      let level: 0 | 1 | 2 | 3 | 4 | 5 = 0;
      if (isWeekday) {
        if (h >= 9 && h <= 11) level = 4;
        else if (h >= 13 && h <= 15) level = 5;
        else if (h >= 16 && h <= 18) level = 3;
        else if (h >= 19 && h <= 22) level = 2;
        else if (h >= 7 && h <= 8) level = 2;
        else if (h >= 23 || h <= 5) level = 0;
        else level = 1;
      } else {
        if (h >= 10 && h <= 14) level = 2;
        else if (h >= 19 && h <= 22) level = 1;
      }
      // 결정적인 변동 (재현 가능): index 기반 미세 흔들기
      const seed = ((d * 24 + h) * 9301 + 49297) % 233280;
      const variance = (seed / 233280 - 0.5) * 0.6;
      const adjusted = Math.max(0, Math.min(5, Math.round(level + variance)));
      const count = adjusted * 25 + (seed % 20);
      out.push({
        day: d as HourlyHeatCell['day'],
        hour: h,
        count,
        level: adjusted as HourlyHeatCell['level'],
      });
    }
  }
  return out;
})();

export const INCIDENT_DETAILS: Record<IncidentKey, IncidentDetail> = {
  'dup-edit': {
    key: 'dup-edit',
    title: '중복 수정 자산',
    desc: '동일 자산을 2명 이상이 수정한 케이스. 마지막 저장이 반영되며 이전 입력은 변경 이력에 보존됩니다.',
    count: '87 건',
    recent24h: '+4 건',
    firstOccurrence: '5/15 09:22',
    columns: ['자산', '충돌한 사용자', '마지막 충돌'],
    rows: [
      { id: '1', ip: '10.20.30.40', host: 'dev-server-01.lge.com', a: '김상우', b: '박지훈', when: '오늘 14:38' },
      { id: '2', ip: '10.20.30.42', host: 'dev-db-primary.lge.com', a: '박지훈', b: '이수민', when: '오늘 13:11' },
      { id: '3', ip: '10.42.5.18', host: 'app-stage-04.lge.com', a: '정유진', b: '한도윤', when: '오늘 11:47' },
      { id: '4', ip: '172.16.8.91', host: 'jenkins-master.lge.com', a: '한도윤', b: '김상우', when: '어제 17:02' },
      { id: '5', ip: '10.55.12.7', host: 'rd-bench-22.lge.com', a: '이수민', b: '정유진', when: '어제 15:34' },
      { id: '6', ip: '10.20.30.55', host: 'test-bench-08.lge.com', a: '김상우', b: '한도윤', when: '어제 10:09' },
      { id: '7', ip: '10.88.4.130', host: 'qa-runner-01.lge.com', a: '박지훈', b: '정유진', when: '5/19 16:48' },
    ],
  },
  'overwrite-5min': {
    key: 'overwrite-5min',
    title: '5분 내 덮어쓰기',
    desc: '동시 수정 알림 후 사용자가 "내 입력으로 덮어쓰기"를 선택한 케이스. 이전 사용자의 입력은 변경 이력에서 확인 가능합니다.',
    count: '23 건',
    recent24h: '+1 건',
    firstOccurrence: '5/16 11:08',
    columns: ['자산', '덮어쓴 사용자', '덮어쓴 시점'],
    rows: [
      { id: '1', ip: '10.20.30.42', host: 'dev-db-primary.lge.com', who: '김상우', prev: '박지훈', when: '오늘 14:42' },
      { id: '2', ip: '10.42.5.18', host: 'app-stage-04.lge.com', who: '정유진', prev: '이수민', when: '오늘 13:15' },
      { id: '3', ip: '172.16.8.91', host: 'jenkins-master.lge.com', who: '한도윤', prev: '김상우', when: '어제 17:08' },
      { id: '4', ip: '10.88.4.130', host: 'qa-runner-01.lge.com', who: '박지훈', prev: '정유진', when: '5/19 17:01' },
    ],
  },
  'ip-dup': {
    key: 'ip-dup',
    title: 'IP 중복 → 기존 자산 유도',
    desc: '신규 등록 시도 중 IP 중복이 감지되어 기존 자산 수정으로 유도된 케이스.',
    count: '142 건',
    recent24h: '+18 건',
    firstOccurrence: '5/14 16:33',
    columns: ['중복된 IP', '기존 자산', '시도 사용자', '발생 시점'],
    rows: [
      { id: '1', ip: '10.20.30.40', host: 'dev-server-01.lge.com', who: '김상우', when: '오늘 14:21' },
      { id: '2', ip: '10.55.12.7', host: 'rd-bench-22.lge.com', who: '한도윤', when: '오늘 11:39' },
      { id: '3', ip: '10.42.5.18', host: 'app-stage-04.lge.com', who: '이수민', when: '오늘 10:55' },
      { id: '4', ip: '172.16.8.91', host: 'jenkins-master.lge.com', who: '정유진', when: '어제 16:14' },
      { id: '5', ip: '10.88.4.130', host: 'qa-runner-01.lge.com', who: '박지훈', when: '어제 14:02' },
    ],
  },
  'zero-to-new': {
    key: 'zero-to-new',
    title: '검색 0건 후 신규 등록 전환',
    desc: '검색 결과가 0건이었을 때, 사용자가 신규 등록까지 진행한 비율과 이탈한 비율의 상세 내역.',
    count: '68 %',
    recent24h: '+5%p',
    firstOccurrence: '5/14 17:10',
    columns: ['검색어', '사용자', '진행 결과', '시점'],
    rows: [
      { id: '1', kw: 'test-server-99', who: '김상우', result: '신규 등록 완료', resultType: 'ok', when: '오늘 14:18' },
      { id: '2', kw: 'rd-pilot-12', who: '한도윤', result: '신규 등록 완료', resultType: 'ok', when: '오늘 12:44' },
      { id: '3', kw: 'temp-001', who: '정유진', result: '이탈', resultType: 'no', when: '오늘 10:33' },
      { id: '4', kw: 'lab-edge-22', who: '이수민', result: '신규 등록 완료', resultType: 'ok', when: '어제 16:18' },
      { id: '5', kw: 'mac-jhpark', who: '박지훈', result: '이탈', resultType: 'no', when: '어제 14:51' },
      { id: '6', kw: 'lge-mini-01', who: '한도윤', result: '신규 등록 완료', resultType: 'ok', when: '5/19 15:22' },
    ],
  },
  'retry-abandon': {
    key: 'retry-abandon',
    title: '유효성 실패 후 재시도 / 이탈',
    desc: '저장 시 유효성 검증에 실패한 후, 사용자가 재시도하여 저장에 성공했거나 이탈한 케이스.',
    count: '81 / 19%',
    recent24h: '재시도 +12',
    firstOccurrence: '5/14 16:51',
    columns: ['자산', '사용자', '실패 사유', '결과'],
    rows: [
      { id: '1', ip: '10.20.30.40', host: 'dev-server-01.lge.com', who: '김상우', reason: 'IP 형식 오류', result: '재시도 성공', resultType: 'ok' },
      { id: '2', ip: '10.42.5.18', host: 'app-stage-04.lge.com', who: '정유진', reason: '필수 항목 누락 (3건)', result: '재시도 성공', resultType: 'ok' },
      { id: '3', ip: '172.16.8.91', host: 'jenkins-master.lge.com', who: '한도윤', reason: '도메인 형식 오류', result: '이탈', resultType: 'no' },
      { id: '4', ip: '10.55.12.7', host: 'rd-bench-22.lge.com', who: '이수민', reason: 'IP 형식 오류', result: '재시도 성공', resultType: 'ok' },
      { id: '5', ip: '10.88.4.130', host: 'qa-runner-01.lge.com', who: '박지훈', reason: '필수 항목 누락 (5건)', result: '이탈', resultType: 'no' },
    ],
  },
};
