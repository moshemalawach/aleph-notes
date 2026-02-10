import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-xl p-0 border border-edge bg-elevated text-ink"
      style={{ boxShadow: 'var(--c-shadow-lg)' }}
    >
      <div className="p-6 max-w-sm">
        <h3 className="text-base font-display font-semibold">{title}</h3>
        <p className="mt-2.5 text-[13px] text-ink-secondary leading-relaxed font-body">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[13px] font-medium rounded-lg hover:bg-hover transition-all duration-200 font-body"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-[13px] font-medium rounded-lg bg-danger text-white hover:bg-danger-hover transition-all duration-200 font-body"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
