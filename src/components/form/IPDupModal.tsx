import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="warn"
      title={t('modal.ipConflict.title')}
      description={t('modal.ipConflict.body')}
      actions={
        <>
          <Button onClick={onClose}>{t('form.actions.cancel')}</Button>
          <Button variant="danger" onClick={onOverwrite}>
            {t('modal.ipConflict.forceCreate')}
          </Button>
          <Button variant="primary" onClick={onEditExisting}>
            {t('modal.ipConflict.editExisting')}
          </Button>
        </>
      }
    >
      {existing && (
        <div className="rounded-md border border-line bg-bg-soft/60 px-3 py-2.5 text-[12.5px]">
          <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
            {t('modal.ipConflict.existing')}
          </div>
          <div className="mt-0.5 font-mono text-text">
            {existing.hostname}.{existing.domain}
          </div>
          <div className="mt-0.5 text-text-3">
            {existing.ips.join(', ')} · {t('modal.ipConflict.ownerLabel')}{' '}
            {existing.owner ? existing.owner.name : t('form.unassignedShort')}
          </div>
        </div>
      )}
    </Modal>
  );
}
