import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
}

export function ConfirmSheet({ open, onClose, title, description, confirmLabel, onConfirm, danger }: ConfirmSheetProps) {
  const { t } = useI18n();
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-ink-2">{description}</p>
      <div className="mt-6 grid gap-2">
        <Button
          size="lg"
          className={danger ? 'bg-abusive text-white hover:bg-abusive/90' : undefined}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
        <Button size="lg" variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </Sheet>
  );
}
