import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { fetchSampleAssets } from './csv';
import * as store from './store';

export const worker = setupWorker(...handlers);

export async function startMockWorker() {
  // CSV가 fetch 가능해야 하므로 MSW 부팅과 CSV 로드를 분리
  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    });
  } catch (err) {
    console.error('[mocks] worker start failed', err);
    return;
  }

  try {
    const items = await fetchSampleAssets('/sample-assets.csv');
    if (items.length > 0) {
      store.setAll(items);
      console.info(`[mocks] CSV에서 자산 ${items.length}건 로드 완료`);
    } else {
      console.warn('[mocks] CSV가 비어있어 기본 mock 자산을 사용합니다');
    }
  } catch (err) {
    console.warn('[mocks] CSV 로드 실패, 기본 mock 자산 사용', err);
  }
}
