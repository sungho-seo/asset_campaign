import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

async function bootstrap() {
  // Mock 서비스 워커는 항상 부팅한다 (개발팀 워킹 샘플 용).
  // 실 백엔드로 전환 시: 이 블록 제거 + src/lib/api.ts의 API_BASE를 실 엔드포인트로 변경.
  const { startMockWorker } = await import('./mocks/browser');
  await startMockWorker();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
