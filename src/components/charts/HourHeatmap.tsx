import type { HourlyHeatCell } from '../../types/domain';
import { cn } from '../../lib/cn';

type HourHeatmapProps = {
  data: HourlyHeatCell[];
};

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const levelClass: Record<number, string> = {
  0: 'bg-bg-soft',
  1: 'bg-[#e0e7ff]',
  2: 'bg-[#a5b4fc]',
  3: 'bg-[#6366f1]',
  4: 'bg-[#4338ca]',
  5: 'bg-[#1e1b4b]',
};

export function HourHeatmap({ data }: HourHeatmapProps) {
  const byKey = new Map(data.map((c) => [`${c.day}-${c.hour}`, c]));
  return (
    <div className="px-5 py-4">
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: '36px repeat(24, 1fr)',
          gridTemplateRows: '18px repeat(7, 1fr)',
        }}
      >
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={`h-${h}`}
            className="grid place-items-center font-mono text-[9.5px] text-text-3"
          >
            {h % 3 === 0 ? h : ''}
          </div>
        ))}
        {DAYS.map((dl, d) => (
          <div key={`row-${d}`} className="contents">
            <div className="flex items-center justify-end pr-1.5 font-mono text-[9.5px] text-text-3">
              {dl}
            </div>
            {Array.from({ length: 24 }, (_, h) => {
              const cell = byKey.get(`${d}-${h}`);
              const lvl = cell?.level ?? 0;
              return (
                <div
                  key={`c-${d}-${h}`}
                  title={`${dl} ${h}시 · ${cell?.count ?? 0}명`}
                  className={cn(
                    'aspect-square min-h-[14px] rounded-sm transition-transform',
                    'hover:z-10 hover:scale-[1.3] hover:outline hover:outline-[1.5px] hover:outline-text',
                    levelClass[lvl]
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-text-3">
        <span>요일 × 시간 (0–23)</span>
        <span className="flex items-center gap-1">
          <span>낮음</span>
          {[0, 1, 2, 3, 4, 5].map((l) => (
            <span key={l} className={cn('h-2.5 w-2.5 rounded-sm', levelClass[l])} />
          ))}
          <span>높음</span>
        </span>
      </div>
    </div>
  );
}
