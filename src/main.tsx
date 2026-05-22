import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

async function bootstrap() {
  // dev 모드(npm run dev)에서만 MSW 부팅.
  // production 빌드(npm run start로 Express 서빙)에서는 실제 /api/*가 응답.
  if (import.meta.env.DEV) {
    const { startMockWorker } = await import('./mocks/browser');
    await startMockWorker();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
