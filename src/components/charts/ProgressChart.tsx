import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { ProgressPoint } from '../../types/domain';
import { CAMPAIGN_DAYS, TODAY_DPLUS, TOTAL_ASSETS } from '../../lib/dashboardMock';
import { formatDateMD } from '../../lib/format';

type ProgressChartProps = {
  data: ProgressPoint[];
};

function buildSeries(data: ProgressPoint[]): Array<{
  dPlus: number;
  date: string;
  pct: number | null;
}> {
  const map = new Map(data.map((p) => [p.dPlus, p]));
  const out: Array<{ dPlus: number; date: string; pct: number | null }> = [];
  for (let d = 0; d < CAMPAIGN_DAYS; d++) {
    const p = map.get(d);
    out.push({ dPlus: d, date: p?.date ?? '', pct: p ? p.pct : null });
  }
  return out;
}

function TickXAxis({ x, y, payload }: { x?: number; y?: number; payload?: { value: number } }) {
  const d = payload?.value ?? 0;
  if (![0, 5, 10, 15, 20, 25, 29].includes(d)) return null;
  const dt = new Date('2026-05-14');
  dt.setDate(dt.getDate() + d);
  return (
    <g transform={`translate(${x},${y})`}>
      <text className="font-mono" textAnchor="middle" fill="#78716c" fontSize={10} dy={12}>
        D+{d}
      </text>
      <text className="font-mono" textAnchor="middle" fill="#a8a29e" fontSize={10} dy={24}>
        {formatDateMD(dt.toISOString())}
      </text>
    </g>
  );
}

type TooltipPayload = { value: number | null; payload: { dPlus: number; date: string; pct: number | null } };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  if (p.pct == null) return null;
  const count = Math.round((TOTAL_ASSETS * p.pct) / 100);
  return (
    <div className="rounded-md bg-text px-2.5 py-1.5 font-mono text-[11.5px] text-white shadow-lg">
      <div className="font-semibold">
        D+{p.dPlus} · {p.date && formatDateMD(p.date)}
      </div>
      <div className="text-bg-soft">식별율 {p.pct}%</div>
      <div className="text-bg-soft">
        {count.toLocaleString()} / {TOTAL_ASSETS.toLocaleString()}건
      </div>
    </div>
  );
}

export function ProgressChart({ data }: ProgressChartProps) {
  const series = buildSeries(data);
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 12, right: 16, left: 0, bottom: 28 }}>
          <defs>
            <linearGradient id="prog-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#A50034" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#A50034" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e7e5e4" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="dPlus"
            type="number"
            domain={[0, CAMPAIGN_DAYS - 1]}
            ticks={[0, 5, 10, 15, 20, 25, 29]}
            tick={TickXAxis as never}
            tickLine={false}
            axisLine={{ stroke: '#e7e5e4' }}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#0c0a09', strokeDasharray: '3 3', strokeOpacity: 0.4 }}
          />
          <ReferenceLine
            x={TODAY_DPLUS}
            stroke="#0c0a09"
            strokeDasharray="2 3"
            strokeOpacity={0.25}
          />
          <Area
            type="monotone"
            dataKey="pct"
            stroke="none"
            fill="url(#prog-area)"
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="#A50034"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={{ r: 3, fill: '#A50034', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#A50034', stroke: '#fff', strokeWidth: 2.5 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
