import type { Asset } from '../../types/domain';
import { Modal } from '../feedback/Modal';
import { Button } from '../common/Button';
import { formatDateTime } from '../../lib/format';

type ConflictModalProps = {
  open: boolean;
  serverAsset: Asset | null;
  onClose: () => void;
  onOverwrite: () => void;
  onAdoptServer: () => void;
};

export function ConflictModal({
  open,
  serverAsset,
  onClose,
  onOverwrite,
  onAdoptServer,
}: ConflictModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="warn"
      title="동시 수정이 감지되었습니다"
      description="다른 사용자가 같은 자산을 먼저 저장했습니다. 어떻게 할까요?"
      actions={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="ghost" onClick={onAdoptServer}>
            상대 입력 가져오기
          </Button>
          <Button variant="danger" onClick={onOverwrite}>
            내 입력으로 덮어쓰기
          </Button>
        </>
      }
    >
      {serverAsset && (
        <div className="rounded-md border border-line bg-bg-soft/60 px-3 py-2.5 text-[12.5px]">
          <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
            최근 저장
          </div>
          <div className="mt-0.5 text-text">
            <span className="font-medium">{serverAsset.updatedBy ?? '—'}</span>
            <span className="text-text-3">
              {' '}
              · {serverAsset.updatedAt ? formatDateTime(serverAsset.updatedAt) : '—'}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}
