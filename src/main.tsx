import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';

async function bootstrap() {
  // dev 모드(npm run dev)에서만 MSW 부팅.
  // production 빌드(npm run start로 Express 서빙)에서는 실제 /api/*가 응답.
  if (import.meta.env.DEV) {
    const { startMockWorker } = await import('./mocks/browser');
    await startMockWorker();
  } else if ('serviceWorker' in navigator) {
    // 과거에 dev로 접속한 브라우저에 MSW worker가 남아 있을 수 있음.
    // 운영 모드에서는 모든 SW를 unregister해서 /api/* 요청이 정상적으로 서버에 도달하게 보장.
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      // SW 미지원 또는 권한 오류는 무시 — 부팅을 막지 않음
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
