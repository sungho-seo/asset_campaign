import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

// 한/EN 토글. 클릭하면 i18next 언어 즉시 전환 + localStorage에 저장됨.
// 대시보드는 번역 범위 밖이라 영문 모드에서도 한글 텍스트가 그대로 보일 수 있음 (의도된 한계).
export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? 'ko';
  const isEn = lang.startsWith('en');

  const setLang = (next: 'ko' | 'en') => {
    if (next === lang) return;
    void i18n.changeLanguage(next);
  };

  const buttonClass = (active: boolean) =>
    cn(
      'h-7 min-w-[36px] px-2.5 font-mono text-[11px] transition-colors',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-soft',
      active
        ? 'bg-brand text-white'
        : 'bg-transparent text-text-3 hover:text-text'
    );

  return (
    <div
      role="group"
      aria-label={t('topbar.lang.switchTo', { lang: isEn ? '한국어' : 'English' })}
      className="flex overflow-hidden rounded-md border border-line"
    >
      <button
        type="button"
        className={buttonClass(!isEn)}
        aria-pressed={!isEn}
        onClick={() => setLang('ko')}
      >
        {t('topbar.lang.korean')}
      </button>
      <span aria-hidden className="w-px self-stretch bg-line" />
      <button
        type="button"
        className={buttonClass(isEn)}
        aria-pressed={isEn}
        onClick={() => setLang('en')}
      >
        {t('topbar.lang.english')}
      </button>
    </div>
  );
}
