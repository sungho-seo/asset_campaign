import type { Asset, NoticeResponse, Owner } from '../types/domain';

export const MOCK_USER: Owner = {
  name: '박지훈',
  email: 'jihoon.park@lge.com',
  dept: '보안운영실',
};

// 시연용 권고 응답 이력 시드.
// 기본 store는 빈 배열로 시작 — 첫 진입 시 권고 페이지 자동 노출 동작을 보여주기 위해서.
// 개발 모드 디버그 패널에서 '샘플 이력으로 채우기'를 누르면 이 데이터가 store에 주입된다.
// 시나리오 R(권고 응답 재확인/수정): '보유 없음' → '보유 있음'으로 변경한 이력 패턴.
export const MOCK_NOTICE_HISTORY: NoticeResponse[] = [
  {
    responseId: 'NTC-SEED-001',
    empName: MOCK_USER.name,
    dept: MOCK_USER.dept,
    acknowledged: true,
    ownership: 'none',
    respondedAt: '2026-04-02T09:14:00Z',
  },
  {
    responseId: 'NTC-SEED-002',
    empName: MOCK_USER.name,
    dept: MOCK_USER.dept,
    acknowledged: true,
    ownership: 'has',
    respondedAt: '2026-05-18T15:42:00Z',
  },
];

// 동명이인 패턴이 포함된 사내 구성원 샘플 디렉토리.
// 담당자 이름 input에서 Enter → /api/directory/search 가 이 목록을 검색.
export const MOCK_DIRECTORY: Owner[] = [
  // 박지훈 — 본인 + 동명이인 2명
  { name: '박지훈', email: 'jihoon.park@lge.com', dept: '보안운영실' },
  { name: '박지훈', email: 'jihoon.park.cl@lge.com', dept: '클라우드플랫폼팀' },
  { name: '박지훈', email: 'jihoon.park.mk@lge.com', dept: '마케팅전략팀' },

  // 김상우 — 동명이인 2명
  { name: '김상우', email: 'sangwoo.kim@lge.com', dept: '보안솔루션실' },
  { name: '김상우', email: 'sangwoo.kim.dr@lge.com', dept: '단말연구소' },

  // 이수민 — 동명이인 3명
  { name: '이수민', email: 'sumin.lee@lge.com', dept: '단말연구소' },
  { name: '이수민', email: 'sumin.lee.fi@lge.com', dept: '재무팀' },
  { name: '이수민', email: 'sumin.lee.hr@lge.com', dept: 'HR전략팀' },

  // 정유진 — 동명이인 2명
  { name: '정유진', email: 'yujin.jung@lge.com', dept: '클라우드플랫폼팀' },
  { name: '정유진', email: 'yujin.jung.dx@lge.com', dept: 'DX전략실' },

  // 한도윤 — 동명이인 2명
  { name: '한도윤', email: 'doyoon.han@lge.com', dept: '플랫폼인프라팀' },
  { name: '한도윤', email: 'doyoon.han.lg@lge.com', dept: '법무팀' },

  // 김민준 — 동명이인 2명
  { name: '김민준', email: 'minjun.kim@lge.com', dept: 'SW아키텍처팀' },
  { name: '김민준', email: 'minjun.kim.sl@lge.com', dept: '영업본부' },

  // 단독 이름
  { name: '최서연', email: 'seoyeon.choi@lge.com', dept: '디자인센터' },
  { name: '조민호', email: 'minho.cho@lge.com', dept: '품질관리팀' },
  { name: '윤지아', email: 'jia.yoon@lge.com', dept: '서비스기획팀' },
  { name: '강현우', email: 'hyunwoo.kang@lge.com', dept: '데이터분석팀' },
  { name: '오세훈', email: 'sehoon.oh@lge.com', dept: '글로벌세일즈팀' },
  { name: '문지은', email: 'jieun.moon@lge.com', dept: 'IT지원팀' },

  // 영문 — 해외 법인 (한/영 혼합 운영 환경)
  { name: 'Daniel Lee', email: 'daniel.lee@lge.com', dept: 'Cloud Platform Team' },
  { name: 'Daniel Lee', email: 'daniel.lee.us@lge.com', dept: 'LG Electronics USA' },
  { name: 'Jonas Becker', email: 'jonas.becker@lge.com', dept: 'Mobility Solutions EMEA' },
  { name: 'Maria Rossi', email: 'maria.rossi@lge.com', dept: 'EMEA Service Operations' },
  { name: 'Priya Iyer', email: 'priya.iyer@lge.com', dept: 'LG Electronics India' },
];

// PRD v5 §5.1 — 자산 유형 [온프레미스 / 클라우드 / 직접입력].
// SelectWithCustom이 '직접입력' 옵션을 자동으로 추가하므로 여기서는 2개만 노출.
export const ASSET_TYPE_OPTIONS = ['온프레미스', '클라우드'];

// PRD v5 §5.2 — 클라우드 제공자.
// '직접입력'은 SelectWithCustom이 자동 추가.
export const CSP_OPTIONS = ['AWS', 'Azure', 'GCP', 'NCP'];

export const OS_OPTIONS = [
  'AIX',
  'HP-UX',
  'Linux',
  'RHEL',
  'RHEV',
  'Rocky',
  'SunOS',
  'SUSE',
  'Ubuntu',
  'Unix',
  'Windows',
  'Windows Server',
  'Xen',
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'ASSET-008291',
    assetType: '온프레미스',
    hostname: 'dev-server-01',
    purpose: '개발 서버',
    ips: ['10.20.30.40'],
    internet: 'no',
    domain: 'lge.com',
    os: 'Ubuntu 22.04',
    osVersion: '22.04.3 LTS',
    location: '서울 마곡 LG사이언스파크 R&D본관 5층 521호',
    security: 'EPP',
    cloud: null,
    owner: null,
    additionalOwners: [],
    qualysDetectedAt: '2026-04-12T09:33:00Z',
    updatedAt: null,
    updatedBy: null,
  },
];
