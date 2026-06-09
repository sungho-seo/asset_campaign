import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Plus,
  RotateCcw,
  Search,
  Users,
} from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { Panel } from '../components/layout/Panel';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { KPICard } from '../components/kpi/KPICard';
import { MetricRow } from '../components/kpi/MetricRow';
import { ProgressChart } from '../components/charts/ProgressChart';
import { HourHeatmap } from '../components/charts/HourHeatmap';
import { StackedBar } from '../components/charts/StackedBar';
import { SideDrawer } from '../components/drawer/SideDrawer';
import { IncidentTable } from '../components/drawer/IncidentTable';
import {
  INCIDENT_DETAILS,
  MOCK_DAILY,
  MOCK_HEATMAP,
  MOCK_KPI,
  MOCK_PROGRESS,
  TODAY_DPLUS,
} from '../lib/dashboardMock';
import type { IncidentKey } from '../types/domain';

export default function DashboardPage() {
  const [incidentKey, setIncidentKey] = useState<IncidentKey | null>(null);
  const [filter, setFilter] = useState('');

  const detail = incidentKey ? INCIDENT_DETAILS[incidentKey] : null;

  return (
    <Shell>
      <PageHeader
        eyebrow="DASHBOARD"
        title="IT 자산 등록 현황"
        subtitle={`전체 자산 ${MOCK_KPI.totalAssets.toLocaleString()}건 기준 · 마지막 업데이트 14:42 (5분 주기)`}
        right={
          <Button>
            <Download className="h-3 w-3" /> CSV 내보내기
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-4 gap-3">
        <KPICard
          label="진행 현황"
          icon={CheckCircle2}
          value={MOCK_KPI.identifiedRate.toFixed(1)}
          unit="%"
          variant="progress"
          progressFill={MOCK_KPI.identifiedRate}
          progressMeta={{
            left: `${MOCK_KPI.identifiedCount.toLocaleString()} / ${MOCK_KPI.totalAssets.toLocaleString()}`,
            right: '전체 자산 대비',
          }}
        />
        <KPICard
          label="접속자"
          icon={Users}
          value={MOCK_KPI.uniqueVisitors.toLocaleString()}
          unit="명"
          delta={{ value: `+${MOCK_KPI.visitorDelta}`, positive: true }}
        />
        <KPICard
          label="업데이트 (수정 / 신규)"
          icon={FileText}
          value={MOCK_KPI.editCount.toLocaleString()}
          unit={`/ ${MOCK_KPI.newRegisterCount}`}
          delta={{
            value: `+${MOCK_KPI.editDelta + MOCK_KPI.newDelta}`,
            positive: true,
          }}
        />
        <KPICard
          label="방치 자산"
          icon={Clock}
          value={MOCK_KPI.abandonedCount.toLocaleString()}
          unit="건"
          delta={{
            value: `${MOCK_KPI.abandonedDelta > 0 ? '+' : '−'}${Math.abs(MOCK_KPI.abandonedDelta)}`,
            positive: MOCK_KPI.abandonedDelta < 0,
          }}
        />
      </div>

      <div
        className="mb-5 grid gap-4"
        style={{ gridTemplateColumns: '1.4fr 1fr' }}
      >
        <Panel
          title="진척률 추이"
          subtitle="등록 시작일 기준 · 일자별 누적 식별율"
          headerRight={
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-text-3">
              <span className="inline-block h-0.5 w-2.5 rounded-full bg-brand" />
              식별율
            </span>
          }
        >
          <ProgressChart data={MOCK_PROGRESS} />
        </Panel>
        <Panel title="시간대별 접속 추이" subtitle="최근 7일 평균 · 요일 × 시간" padded={false}>
          <HourHeatmap data={MOCK_HEATMAP} />
        </Panel>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4">
        <Panel title="IT자산 정보" subtitle="자산 수 기준 · 누적" padded={false}>
          <MetricRow
            icon={CheckCircle2}
            iconColor="green"
            name="자산 정보 수정"
            description="기존 자산의 정보 갱신 건수"
            value={MOCK_KPI.editCount.toLocaleString()}
            unit="건"
            delta={{ value: `+${MOCK_KPI.editDelta}`, direction: 'up' }}
          />
          <MetricRow
            icon={Plus}
            iconColor="purple"
            name="신규 자산 등록"
            description="신규로 발견·등록된 자산"
            value={MOCK_KPI.newRegisterCount.toLocaleString()}
            unit="건"
            delta={{ value: `+${MOCK_KPI.newDelta}`, direction: 'up' }}
          />
          <MetricRow
            icon={Clock}
            iconColor="gray"
            name="방치 자산"
            description="한 번도 업데이트되지 않은 자산"
            value={MOCK_KPI.abandonedCount.toLocaleString()}
            unit="건"
            delta={{
              value: `${MOCK_KPI.abandonedDelta > 0 ? '+' : '−'}${Math.abs(MOCK_KPI.abandonedDelta)}`,
              direction: MOCK_KPI.abandonedDelta < 0 ? 'down' : 'up',
            }}
          />
        </Panel>

        <Panel
          title="이상 징후 / 충돌"
          subtitle="등록 시작 이후 누적 · 클릭하여 상세 보기"
          padded={false}
        >
          <MetricRow
            icon={AlertTriangle}
            iconColor="amber"
            name="중복 수정 자산"
            description="동일 자산을 2명 이상이 수정"
            value="87"
            unit="건"
            delta={{ value: '+4', direction: 'flat' }}
            onClick={() => setIncidentKey('dup-edit')}
          />
          <MetricRow
            icon={RotateCcw}
            iconColor="red"
            name="5분 내 덮어쓰기"
            description="충돌 후 덮어쓰기 결정"
            value="23"
            unit="건"
            delta={{ value: '+1', direction: 'flat' }}
            onClick={() => setIncidentKey('overwrite-5min')}
          />
          <MetricRow
            icon={AlertCircle}
            iconColor="amber"
            name="IP 중복 → 기존 자산 유도"
            description="신규 등록 시도 중 IP 중복 감지"
            value="142"
            unit="건"
            delta={{ value: '+18', direction: 'up' }}
            onClick={() => setIncidentKey('ip-dup')}
          />
          <MetricRow
            icon={Search}
            iconColor="gray"
            name="검색 0건 후 신규 등록율"
            description="0건 → 신규 등록 전환 비율"
            value="68"
            unit="%"
            delta={{ value: '+5%p', direction: 'up' }}
            onClick={() => setIncidentKey('zero-to-new')}
          />
          <MetricRow
            icon={AlertCircle}
            iconColor="gray"
            name="유효성 실패 후 재시도"
            description="재시도 / 이탈 비율"
            value="81"
            unit="/ 19%"
            delta={{ value: '−', direction: 'flat' }}
            onClick={() => setIncidentKey('retry-abandon')}
          />
        </Panel>
      </div>

      <Panel
        title="일자별 신규 vs 수정 비율"
        subtitle={`D+0 ~ D+${TODAY_DPLUS} · 일별 합계 기준`}
        padded={false}
      >
        <StackedBar data={MOCK_DAILY} />
      </Panel>

      <p className="mt-6 text-center font-mono text-[11.5px] text-text-4">
        데이터 갱신 주기 5분 · 분모는 Qualys 식별 전체 자산 수 {MOCK_KPI.totalAssets.toLocaleString()}건 기준
      </p>

      <SideDrawer
        open={!!detail}
        onClose={() => {
          setIncidentKey(null);
          setFilter('');
        }}
        width={720}
        ariaLabel={detail?.title}
        header={
          detail && (
            <>
              <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
                이상 징후 상세
              </div>
              <h2 className="text-base font-semibold tracking-tightish">{detail.title}</h2>
              <p className="mt-0.5 text-[12.5px] text-text-3">{detail.desc}</p>
              <div className="mt-3 flex gap-5">
                <div className="flex flex-col">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-text-3">
                    발생 건수
                  </span>
                  <span className="text-[15px] font-semibold tracking-tightish">
                    {detail.count}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-text-3">
                    최근 24h
                  </span>
                  <span className="text-[15px] font-semibold tracking-tightish">
                    {detail.recent24h}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-text-3">
                    최초 발생
                  </span>
                  <span className="font-mono text-[13px] font-semibold">
                    {detail.firstOccurrence}
                  </span>
                </div>
              </div>
            </>
          )
        }
        toolbar={
          <>
            <div className="relative max-w-[280px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-text-4" />
              <Input
                variant="mono"
                className="py-1.5 pl-7 text-xs"
                placeholder="IP / 자산명으로 필터"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Button size="sm">
              <Download className="h-3 w-3" /> CSV
            </Button>
          </>
        }
      >
        {detail && <IncidentTable detail={detail} filter={filter} />}
      </SideDrawer>
    </Shell>
  );
}
