import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NoticeOwnership, NoticeResponse } from '../types/domain';
import { MOCK_NOTICE_HISTORY, MOCK_USER } from '../lib/mock';

// PRD §4.2 — 권고 안내 응답 store.
// - persist 미들웨어 + sessionStorage 어댑터: 새로고침은 유지하되 탭을 닫으면 사라짐
//   (PRD '외부 영속 저장 X / localStorage 금지' 의도와 부합).
// - 응답은 누적 보관 (F-NOTICE-4). 가장 최근 항목이 현재 상태.

type NoticeState = {
  responses: NoticeResponse[];
  submitResponse: (ownership: NoticeOwnership) => NoticeResponse;
  resetForDev: () => void;
  seedDevSamples: () => void;
};

// UUID 생성 — 브라우저/Node18+ 양쪽 지원. 구형 환경 fallback도 보강.
function newResponseId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ntc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useNoticeStore = create<NoticeState>()(
  persist(
    (set) => ({
      responses: [],

      submitResponse: (ownership) => {
        const next: NoticeResponse = {
          responseId: newResponseId(),
          // 현 단계는 mock auth — 향후 useMe() 등으로 교체. empNo는 v7 요구상 미수집.
          empName: MOCK_USER.name,
          dept: MOCK_USER.dept,
          acknowledged: true,
          ownership,
          respondedAt: new Date().toISOString(),
        };
        set((s) => ({ responses: [...s.responses, next] }));
        return next;
      },

      resetForDev: () => set({ responses: [] }),
      seedDevSamples: () => set({ responses: [...MOCK_NOTICE_HISTORY] }),
    }),
    {
      name: 'it-asset-notice-store',
      storage: createJSONStorage(() => sessionStorage),
      // responses만 persist. 액션 함수는 직렬화 불가/불필요.
      partialize: (s) => ({ responses: s.responses }),
      version: 1,
    }
  )
);

// ─────────────────────────────────────────────
// Selector hooks — React 컴포넌트 내부 구독용.
// ─────────────────────────────────────────────

export function useLatestNoticeResponse(): NoticeResponse | null {
  return useNoticeStore(
    (s) => s.responses[s.responses.length - 1] ?? null
  );
}

export function useHasRespondedNotice(): boolean {
  return useNoticeStore((s) => s.responses.length > 0);
}

export function useCurrentOwnership(): NoticeOwnership | null {
  return useNoticeStore(
    (s) => s.responses[s.responses.length - 1]?.ownership ?? null
  );
}

// ─────────────────────────────────────────────
// 비반응형 getter — 가드/이벤트 핸들러 등 컴포넌트 외부에서 호출용.
// ─────────────────────────────────────────────

export function getLatestNoticeResponse(): NoticeResponse | null {
  const { responses } = useNoticeStore.getState();
  return responses[responses.length - 1] ?? null;
}

export function hasRespondedNotice(): boolean {
  return useNoticeStore.getState().responses.length > 0;
}
