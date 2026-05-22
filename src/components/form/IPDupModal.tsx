import type { Asset } from '../../types/domain';
import { Modal } from '../feedback/Modal';
import { Button } from '../common/Button';

type IPDupModalProps = {
  open: boolean;
  existing: Asset | null;
  onClose: () => void;
  onEditExisting: () => void;
  onOverwrite: () => void;
};

export function IPDupModal({
  open,
  existing,
  onClose,
  onEditExisting,
  onOverwrite,
}: IPDupModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="warn"
      title="이미 등록된 IP입니다"
      description="입력한 IP는 다른 자산에 이미 등록되어 있습니다. 기존 자산을 수정하시겠어요?"
      actions={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="danger" onClick={onOverwrite}>
            그래도 신규 등록
          </Button>
          <Button variant="primary" onClick={onEditExisting}>
            기존 자산 수정
          </Button>
        </>
      }
    >
      {existing && (
        <div className="rounded-md border border-line bg-bg-soft/60 px-3 py-2.5 text-[12.5px]">
          <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
            기존 자산
          </div>
          <div className="mt-0.5 font-mono text-text">
            {existing.hostname}.{existing.domain}
          </div>
          <div className="mt-0.5 text-text-3">
            {existing.ips.join(', ')} · 담당자{' '}
            {existing.owner ? existing.owner.name : '미지정'}
          </div>
        </div>
      )}
    </Modal>
  );
}
