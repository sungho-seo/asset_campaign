import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="warn"
      title={t('modal.conflict.title')}
      description={t('modal.conflict.body')}
      actions={
        <>
          <Button onClick={onClose}>{t('form.actions.cancel')}</Button>
          <Button variant="ghost" onClick={onAdoptServer}>
            {t('modal.conflict.adoptServer')}
          </Button>
          <Button variant="danger" onClick={onOverwrite}>
            {t('modal.conflict.overwriteMine')}
          </Button>
        </>
      }
    >
      {serverAsset && (
        <div className="rounded-md border border-line bg-bg-soft/60 px-3 py-2.5 text-[12.5px]">
          <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
            {t('modal.conflict.recentSave')}
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
