import { useState } from 'react';
import {
  Search,
  Download,
  Plus,
  CheckCircle2,
  Users,
  FileText,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { Panel } from '../components/layout/Panel';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ToggleGroup } from '../components/common/ToggleGroup';
import { Badge } from '../components/common/Badge';
import { Pill } from '../components/common/Pill';
import { Avatar } from '../components/common/Avatar';
import { UserChip } from '../components/common/UserChip';
import { Banner } from '../components/feedback/Banner';
import { Modal } from '../components/feedback/Modal';
import { useToast } from '../components/feedback/Toast';
import { SideDrawer } from '../components/drawer/SideDrawer';
import { KPICard } from '../components/kpi/KPICard';
import { MetricRow } from '../components/kpi/MetricRow';
import { ValidationBanner } from '../components/form/ValidationBanner';

export default function ComponentsDemo() {
  const [toggle, setToggle] = useState<'installed' | 'not-installed' | 'na' | null>(
    'installed'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { show } = useToast();

  return (
    <Shell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-text-3">
            DESIGN SYSTEM
          </div>
          <h1 className="text-2xl font-semibold tracking-tighter2">컴포넌트 카탈로그</h1>
          <p className="mt-1 text-sm text-text-3">Phase 2 — 시각 검수용 데모</p>
        </div>
        <UserChip name="박지훈" meta="보안운영실" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Button" subtitle="variant × size">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm">SM</Button>
            <Button size="sm" variant="primary">
              <Plus className="h-3 w-3" /> Add
            </Button>
            <Button size="sm" variant="ghost">
              <Download className="h-3 w-3" /> CSV
            </Button>
          </div>
        </Panel>

        <Panel title="Input" subtitle="default / mono / error / emptyFlag">
          <div className="space-y-2.5">
            <Input placeholder="기본 입력" />
            <Input variant="mono" placeholder="___.___.___.___" />
            <Input variant="mono" error defaultValue="10.20.30.999" />
            <Input emptyFlag placeholder="신규 등록 시 빈 필드 (노란 배경)" />
          </div>
        </Panel>

        <Panel title="ToggleGroup" subtitle="백신 / EDR 같은 3-state">
          <ToggleGroup
            value={toggle}
            onChange={setToggle}
            options={[
              { value: 'installed', label: '설치됨' },
              { value: 'not-installed', label: '미설치' },
              { value: 'na', label: '해당없음' },
            ]}
          />
        </Panel>

        <Panel title="Badge / Pill / Avatar">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="unassigned">미지정</Badge>
            <Badge variant="assigned">담당자 있음</Badge>
            <Badge variant="mine">내 자산</Badge>
            <Badge variant="danger">충돌</Badge>
            <Badge variant="success">완료</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill dot="success">캠페인 진행중 · D+7</Pill>
            <Pill dot="warn">D-3 남음</Pill>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Avatar name="김상우" />
            <Avatar name="박지훈" tone="alt" />
            <Avatar name="이수민" size="sm" />
          </div>
        </Panel>

        <Panel title="Banner">
          <div className="space-y-2">
            <Banner tone="info">검색은 5가지 모드를 지원합니다.</Banner>
            <Banner tone="warn" title="확인 필요">
              IP 형식이 올바르지 않습니다.
            </Banner>
            <Banner tone="danger" title="저장 실패">
              네트워크 오류가 발생했습니다.
            </Banner>
            <Banner tone="success">자산이 저장되었습니다.</Banner>
          </div>
        </Panel>

        <Panel title="ValidationBanner" subtitle="저장 시도 후 오류 종합">
          <ValidationBanner
            errors={[
              { key: 'ip', label: 'IP 주소 형식 확인 (1건)' },
              { key: 'domain', label: '도메인 형식 확인' },
              { key: 'os', label: '운영체제 선택' },
            ]}
          />
        </Panel>

        <Panel title="KPI Card">
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="진행 현황"
              icon={CheckCircle2}
              value="23.4"
              unit="%"
              variant="progress"
              progressFill={23.4}
              progressMeta={{ left: '3,006 / 12,847', right: '전체 자산 대비' }}
            />
            <KPICard
              label="접속자"
              icon={Users}
              value="2,184"
              unit="명"
              delta={{ value: '+312', positive: true }}
            />
          </div>
        </Panel>

        <Panel title="MetricRow" padded={false}>
          <div>
            <MetricRow
              icon={CheckCircle2}
              iconColor="green"
              name="자산 정보 수정"
              description="기존 자산의 정보 갱신 건수"
              value="2,704"
              unit="건"
              delta={{ value: '+382', direction: 'up' }}
            />
            <MetricRow
              icon={AlertTriangle}
              iconColor="amber"
              name="중복 수정 자산"
              description="동일 자산을 2명 이상이 수정"
              value="87"
              unit="건"
              delta={{ value: '+4', direction: 'flat' }}
              onClick={() => show('이상 징후 드로어 (Phase 4에서 연결)', 'info')}
            />
          </div>
        </Panel>

        <Panel title="Toast / Modal / Drawer" subtitle="피드백 컴포넌트">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => show('수정 사항이 저장되었습니다', 'success')}>
              Toast (success)
            </Button>
            <Button onClick={() => show('네트워크 오류', 'error')} variant="danger">
              Toast (error)
            </Button>
            <Button onClick={() => setModalOpen(true)}>Modal 열기</Button>
            <Button onClick={() => setDrawerOpen(true)} variant="primary">
              SideDrawer 열기
            </Button>
          </div>
        </Panel>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="동시 수정이 감지되었습니다"
        description="다른 사용자가 5분 이내에 같은 자산을 수정했습니다. 어떻게 할까요?"
        actions={
          <>
            <Button onClick={() => setModalOpen(false)}>취소</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              상대 입력 가져오기
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              내 입력으로 덮어쓰기
            </Button>
          </>
        }
      />

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        header={
          <>
            <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
              자산 편집
            </div>
            <h2 className="text-base font-semibold tracking-tightish">
              dev-server-01.lge.com
            </h2>
            <div className="mt-0.5 text-[13px] text-text-3">
              ASSET-008291 · 마지막 수정 14:38 (김상우)
            </div>
          </>
        }
        toolbar={
          <>
            <div className="relative max-w-[280px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-text-4" />
              <Input
                variant="mono"
                className="py-1.5 pl-7 text-xs"
                placeholder="IP / 자산명으로 필터"
              />
            </div>
            <Button size="sm">
              <Download className="h-3 w-3" />
              CSV
            </Button>
          </>
        }
        footer={
          <>
            <Button onClick={() => setDrawerOpen(false)}>취소</Button>
            <Button variant="primary" onClick={() => setDrawerOpen(false)}>
              저장
            </Button>
          </>
        }
      >
        <div className="px-6 py-5">
          <p className="text-[13px] text-text-3">
            <FileText className="mr-1 inline h-3.5 w-3.5" />
            여기에 AssetForm 또는 IncidentTable이 들어갑니다.
          </p>
          <p className="mt-2 text-[13px] text-text-3">
            <Clock className="mr-1 inline h-3.5 w-3.5" />
            ESC 키 / 스크림 클릭으로 닫힙니다.
          </p>
        </div>
      </SideDrawer>
    </Shell>
  );
}
