import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useHasRespondedNotice } from '../stores/noticeStore';

// PRD F-NOTICE-8 — 권고 응답 이력이 없는 사용자가 자산 화면에 직접 접근하면
// 권고 안내 페이지로 리다이렉트. <Outlet/> 자리에 자식 라우트가 렌더된다.
export function RequireNoticeResponse() {
  const responded = useHasRespondedNotice();
  const location = useLocation();
  if (!responded) {
    return <Navigate to="/notice" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
