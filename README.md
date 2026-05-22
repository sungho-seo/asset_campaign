# VCISO 자산조사 캠페인 — 프론트엔드 워킹 샘플

LG전자 보안 부서(VCISO)의 IT 자산 정보 갱신 캠페인을 위한 웹 서비스 프론트엔드.
임직원이 자신의 IT 자산을 검색·수정·등록하고, VCISO가 진행 현황을 대시보드로 모니터링한다.

## 스택

React 18 + TypeScript(strict) · Vite · Tailwind CSS · Recharts · React Router v6 ·
TanStack Query · Zustand · Zod · MSW

## Ubuntu 22.04에서 실행

### 1. Node.js 설치 (Ubuntu 기본 패키지는 너무 오래됨)

```bash
# NodeSource로 Node 20 LTS 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # v20.x
npm --version    # 10.x
```

### 2. 클론 + 의존성 설치

```bash
git clone https://github.com/sungho-seo/asset_campaign.git
cd asset_campaign
git checkout claude/gifted-ritchie-Kn0PX
npm install
```

### 3. 개발 서버 띄우기

```bash
# 로컬에서만 접근 (같은 머신)
npm run dev
# → http://localhost:5173

# 다른 PC에서 접근 (LAN/사내망)
npm run dev:host
# → http://0.0.0.0:5173  (자기 IP 주소로 접근, 예: http://10.20.30.40:5173)
```

### 4. 프로덕션 빌드 미리보기 (개발팀 전달 시 권장)

```bash
npm run build
npm run preview:host
# → http://0.0.0.0:4173
```

## 라우팅

| 경로 | 설명 |
|---|---|
| `/` | 임직원 화면 — 자산 검색·수정·신규 등록 |
| `/dashboard` | VCISO 대시보드 — 진행 현황·이상 징후 |
| `/demo` | 디자인 시스템 컴포넌트 카탈로그 |

## 폴더 구조

```
src/
├── routes/                     # 페이지 (Employee/Dashboard/ComponentsDemo)
├── components/
│   ├── common/                 # Button, Input, Toggle, Badge, Pill, Avatar
│   ├── layout/                 # TopBar, Shell, Panel
│   ├── feedback/               # Toast, Modal, Banner
│   ├── drawer/                 # SideDrawer, IncidentTable
│   ├── search/                 # SearchTabs, SearchBox, ResultsList
│   ├── form/                   # AssetForm, IPList, Field, Select, Conflict/IPDup Modal
│   ├── kpi/                    # KPICard, MetricRow
│   └── charts/                 # ProgressChart, HourHeatmap, StackedBar
├── lib/
│   ├── assetStore.ts           # in-memory store + 검색/저장/충돌 API (Phase 5에서 MSW로)
│   ├── mock.ts                 # 8개 샘플 자산 + OS/사업장 옵션
│   ├── dashboardMock.ts        # KPI·차트·이상 징후 픽스처
│   ├── validation.ts           # IP/도메인/이메일 검증 + Zod 스키마
│   ├── format.ts               # 날짜/숫자 포맷터
│   └── cn.ts                   # Tailwind 클래스 머지
├── types/domain.ts             # Asset, Owner, IncidentDetail, ...
└── index.css                   # Tailwind base + Geist/JetBrains Mono import
```

## 백엔드 전환 가이드 (개발팀용)

현재 모든 데이터 호출은 `src/lib/assetStore.ts`의 함수에 격리되어 있습니다.
실제 백엔드로 전환할 때는 이 모듈만 fetch 호출로 교체하면 됩니다.

```ts
// 현재
export async function searchAssets(mode, q, page, pageSize) {
  // in-memory filter
}

// 백엔드 연동 시
export async function searchAssets(mode, q, page, pageSize) {
  const r = await fetch(`/api/assets/search?mode=${mode}&q=${q}&page=${page}`);
  return r.json();
}
```

API 명세는 `HANDOFF.md` §8 참고.

## 디자인 토큰

`tailwind.config.js`에 모두 정의. LG Heart Red(#A50034) 브랜드 컬러는
TopBar 마크 / Primary 버튼 / 진척률 바 / 네비 active 4지점에 절제 적용.

## 자산 입력 항목 변경

3곳만 수정하면 됩니다:
1. `src/types/domain.ts` — `Asset` 타입에 필드 추가
2. `src/lib/validation.ts` — `assetFormSchema`에 Zod 규칙 추가
3. `src/components/form/AssetForm.tsx` — UI 추가
