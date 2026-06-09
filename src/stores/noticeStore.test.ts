import { beforeEach, describe, expect, it } from 'vitest';
import {
  getLatestNoticeResponse,
  hasRespondedNotice,
  useNoticeStore,
} from './noticeStore';

beforeEach(() => {
  // 각 테스트는 빈 상태에서 시작 — sessionStorage가 jsdom에 살아 있어 격리 보장.
  useNoticeStore.getState().resetForDev();
  sessionStorage.clear();
});

describe('noticeStore', () => {
  it('초기 상태는 응답 0건이며 hasResponded=false', () => {
    expect(useNoticeStore.getState().responses).toEqual([]);
    expect(hasRespondedNotice()).toBe(false);
    expect(getLatestNoticeResponse()).toBeNull();
  });

  it('submitResponse는 새 응답을 append하고 hasResponded=true가 됨', () => {
    const r = useNoticeStore.getState().submitResponse('has');
    expect(r.ownership).toBe('has');
    expect(r.acknowledged).toBe(true);
    expect(r.responseId).toMatch(/.+/);
    expect(useNoticeStore.getState().responses).toHaveLength(1);
    expect(hasRespondedNotice()).toBe(true);
    expect(getLatestNoticeResponse()?.ownership).toBe('has');
  });

  it('여러 번 submit해도 이전 응답이 보존되며 최신이 현재 상태', () => {
    useNoticeStore.getState().submitResponse('none');
    useNoticeStore.getState().submitResponse('has');
    useNoticeStore.getState().submitResponse('none');
    const { responses } = useNoticeStore.getState();
    expect(responses).toHaveLength(3);
    expect(responses.map((r) => r.ownership)).toEqual(['none', 'has', 'none']);
    expect(getLatestNoticeResponse()?.ownership).toBe('none');
  });

  it('seedDevSamples는 store를 mock 시드로 채움', () => {
    useNoticeStore.getState().seedDevSamples();
    const { responses } = useNoticeStore.getState();
    expect(responses.length).toBeGreaterThan(0);
    expect(responses.every((r) => r.acknowledged === true)).toBe(true);
  });

  it('resetForDev는 응답을 비움', () => {
    useNoticeStore.getState().submitResponse('has');
    useNoticeStore.getState().resetForDev();
    expect(useNoticeStore.getState().responses).toEqual([]);
    expect(hasRespondedNotice()).toBe(false);
  });
});
