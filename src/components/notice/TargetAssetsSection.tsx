import { Info, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────
// SVG 일러스트 — 카드별 자산 종류 표현.
// 색상은 브랜드 톤과 분리해, 자산 유형 시그널로 동작.
// ─────────────────────────────────────────────

const CloudIcon = () => (
  <svg viewBox="0 0 64 48" className="mx-auto mb-1.5 block h-9 w-12" role="img" aria-label="Cloud">
    <path
      d="M48 28c0-6.6-5.4-12-12-12-1.2 0-2.4 0.2-3.5 0.5C30.8 12.7 27.2 10 23 10c-6 0-11 5-11 11 0 0.5 0 1 0.1 1.5C8.5 23.3 5 27 5 31.5 5 36.7 9.3 41 14.5 41h32C51.7 41 56 36.7 56 31.5c0-2-1.4-3.5-3-3.5-1 0-3 0-5 0z"
      fill="#B5D4F4"
      stroke="#185FA5"
      strokeWidth="1"
    />
  </svg>
);

const ServerIcon = () => (
  <svg viewBox="0 0 64 48" className="mx-auto mb-1.5 block h-9 w-12" role="img" aria-label="Server">
    <rect x="14" y="6" width="36" height="11" rx="2" fill="#CECBF6" stroke="#534AB7" strokeWidth="1" />
    <circle cx="20" cy="11.5" r="1.5" fill="#534AB7" />
    <rect x="26" y="10" width="18" height="3" rx="0.5" fill="#534AB7" opacity="0.4" />
    <rect x="14" y="19" width="36" height="11" rx="2" fill="#CECBF6" stroke="#534AB7" strokeWidth="1" />
    <circle cx="20" cy="24.5" r="1.5" fill="#534AB7" />
    <rect x="26" y="23" width="18" height="3" rx="0.5" fill="#534AB7" opacity="0.4" />
    <rect x="14" y="32" width="36" height="11" rx="2" fill="#CECBF6" stroke="#534AB7" strokeWidth="1" />
    <circle cx="20" cy="37.5" r="1.5" fill="#534AB7" />
    <rect x="26" y="36" width="18" height="3" rx="0.5" fill="#534AB7" opacity="0.4" />
  </svg>
);

const DesktopIcon = () => (
  <svg viewBox="0 0 64 48" className="mx-auto mb-1.5 block h-9 w-12" role="img" aria-label="Desktop PC">
    <rect x="12" y="6" width="40" height="26" rx="2" fill="#9FE1CB" stroke="#0F6E56" strokeWidth="1" />
    <rect x="15" y="9" width="34" height="20" rx="1" fill="#E1F5EE" />
    <rect x="26" y="32" width="12" height="6" fill="#0F6E56" opacity="0.3" />
    <rect x="18" y="38" width="28" height="3" rx="1" fill="#0F6E56" />
  </svg>
);

const LaptopIcon = () => (
  <svg viewBox="0 0 64 48" className="mx-auto mb-1.5 block h-9 w-12" role="img" aria-label="Laptop">
    <path d="M14 10 L50 10 L50 32 L14 32 Z" fill="#FAC775" stroke="#854F0B" strokeWidth="1" />
    <rect x="16.5" y="12.5" width="31" height="17" fill="#FAEEDA" />
    <path d="M8 34 L56 34 L54 40 L10 40 Z" fill="#FAC775" stroke="#854F0B" strokeWidth="1" />
    <rect x="28" y="36" width="8" height="2" rx="1" fill="#854F0B" opacity="0.3" />
  </svg>
);

// 4-카드 그리드와 VM 안내 사이를 연결하는 절제된 구분 표시.
// 방향성(↓ 화살표) 대신 '이어진다'는 시각만 유지.
const InclusionDivider = () => (
  <div
    className="flex items-center justify-center gap-1 text-text-4"
    aria-hidden="true"
  >
    <span className="block h-[2px] w-2 rounded-sm bg-current" />
    <span className="block h-[2px] w-2 rounded-sm bg-current" />
    <span className="block h-[2px] w-2 rounded-sm bg-current" />
  </div>
);

// 카드 정의 — 아이콘 매핑은 코드에, 라벨/부제는 i18n에.
// `cardId`는 i18n `notice.scope.cards.<id>.{name,sub}` 키로 매핑된다.
const CARD_DEFS = [
  { id: 'cloud', Icon: CloudIcon },
  { id: 'server', Icon: ServerIcon },
  { id: 'desktop', Icon: DesktopIcon },
  { id: 'laptop', Icon: LaptopIcon },
] as const;

export function TargetAssetsSection() {
  const { t } = useTranslation();
  const excludeItems = t('notice.scope.excludeItems', {
    returnObjects: true,
  }) as string[];

  return (
    <section className="mb-4 rounded-lg border border-line bg-white p-5 shadow-sm">
      {/* 섹션 헤더 */}
      <p className="mb-3 flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-3">
        <Target className="h-3.5 w-3.5" aria-hidden="true" />
        {t('notice.scope.title')}
      </p>

      {/* Layer 1: 인프라 4종 — 패널 안에서 대비를 위해 bg-soft 유지 */}
      <div className="grid grid-cols-4 gap-2">
        {CARD_DEFS.map(({ id, Icon }) => (
          <div key={id} className="rounded-md bg-bg-soft px-2 py-3.5 text-center">
            <Icon />
            <p className="mb-0.5 break-keep text-[11.5px] font-medium leading-tight">
              {t(`notice.scope.cards.${id}.name`)}
            </p>
            <p className="whitespace-pre-line text-[10.5px] leading-tight text-text-4">
              {t(`notice.scope.cards.${id}.sub`)}
            </p>
          </div>
        ))}
      </div>

      {/* 포함 관계 구분 — '---' 톤의 절제된 분리선 */}
      <div className="mt-3">
        <InclusionDivider />
      </div>

      {/* Layer 2: VM 안내 — 박스 없이 텍스트만 (컨테이너는 이번 캠페인 제외) */}
      <div className="mt-2 text-center">
        <p className="text-[13px] font-medium text-text">
          {t('notice.scope.vmTitle')}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-3">
          {t('notice.scope.vmBody')}
        </p>
      </div>

      {/* 제외 대상 안내 — 시각적 분리 위해 패널 안에서도 warn 톤 유지 */}
      <div className="mt-4 flex items-start gap-2.5 rounded-md border border-amber-200 bg-warn-soft p-3 px-3.5">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-warn" aria-hidden="true" />
        <div className="flex-1">
          <p className="mb-1 text-[13px] font-medium text-warn">
            {t('notice.scope.excludeTitle')}
          </p>
          <ul className="space-y-0.5 text-xs leading-relaxed text-warn/85">
            {excludeItems.map((item, i) => (
              <li key={i} className="flex gap-1.5">
                <span aria-hidden className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-warn/60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
