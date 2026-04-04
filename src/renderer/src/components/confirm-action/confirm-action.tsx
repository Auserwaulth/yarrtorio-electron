import { useState, type ReactNode } from "react";
import { PageModal } from "../page-modal";

interface ConfirmActionProps {
  triggerLabel: ReactNode;
  triggerClassName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  title: string;
  description: ReactNode;
  disabled?: boolean;
  onConfirm(): void | Promise<void>;
}

export function ConfirmAction({
  triggerLabel,
  triggerClassName = "btn",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmClassName = "btn btn-error",
  title,
  description,
  disabled = false,
  onConfirm,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm(): Promise<void> {
    setConfirming(true);

    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <button
        className={triggerClassName}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </button>

      {open ? (
        <PageModal
          onClose={() => {
            if (!confirming) {
              setOpen(false);
            }
          }}
          panelClassName="max-w-md"
          backdropLabel="Close confirmation dialog"
        >
          <div className="border-base-300 bg-base-200/70 border-b px-6 py-5">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>

          <div className="px-6 py-5 text-sm leading-6">{description}</div>

          <div className="border-base-300 bg-base-100/90 flex justify-end gap-3 border-t px-6 py-4">
            <button
              className="btn btn-ghost"
              type="button"
              disabled={confirming}
              onClick={() => setOpen(false)}
            >
              {cancelLabel}
            </button>
            <button
              className={confirmClassName}
              type="button"
              disabled={confirming}
              onClick={() => void handleConfirm()}
            >
              {confirming ? "Working..." : confirmLabel}
            </button>
          </div>
        </PageModal>
      ) : null}
    </>
  );
}
