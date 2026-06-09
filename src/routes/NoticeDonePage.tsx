import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, Search } from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { Button } from '../components/common/Button';

// PRD §3.1 — '보유 없음' 응답 후 완료 화면.
// 단순한 감사 메시지 + 2개의 보조 액션 (응답 변경 / 자유 검색).

export default function NoticeDonePage() {
  const { t } = useTranslation();

  return (
    <Shell className="max-w-[640px]">
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <div className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-wider text-brand">
          {t('noticeDone.eyebrow')}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tighter2 text-text">
          {t('noticeDone.title')}
        </h1>
        <p className="mt-2 max-w-[440px] text-[13px] leading-relaxed text-text-3">
          {t('noticeDone.body')}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Link to="/notice">
            <Button size="md" variant="default">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('noticeDone.backToNotice')}
            </Button>
          </Link>
          <Link to="/">
            <Button size="md" variant="primary">
              <Search className="h-3.5 w-3.5" />
              {t('noticeDone.goToSearch')}
            </Button>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
