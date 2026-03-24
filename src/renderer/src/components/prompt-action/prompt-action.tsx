import { useEffect, useState } from "react";

interface PromptActionProps {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  disabled?: boolean;
  description?: string;
  onConfirm(value: string): void | Promise<void>;
}

export function PromptAction({
  triggerLabel,
  triggerClassName = "btn",
  title,
  label,
  initialValue = "",
  placeholder = "",
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  confirmClassName = "btn btn-primary",
  disabled = false,
  description,
  onConfirm,
}: PromptActionProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setValue(initialValue);
    }
  }, [initialValue, open]);

  async function handleConfirm(): Promise<void> {
    const nextValue = value.trim();
    if (!nextValue) return;

    setSubmitting(true);

    try {
      await onConfirm(nextValue);
      setOpen(false);
    } finally {
      setSubmitting(false);
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
        <dialog className="modal modal-open px-3">
          <div className="modal-box border-base-300 bg-base-100 max-w-md border p-0 shadow-2xl">
            <div className="border-base-300 bg-base-200/70 border-b px-6 py-5">
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>

            <div className="space-y-4 px-6 py-5">
              {description ? (
                <p className="text-base-content/70 text-sm">{description}</p>
              ) : null}

              <fieldset className="fieldset">
                <legend className="fieldset-legend">{label}</legend>
                <input
                  className="input input-bordered w-full"
                  value={value}
                  placeholder={placeholder}
                  onChange={(event) => setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleConfirm();
                    }
                  }}
                  autoFocus
                />
              </fieldset>
            </div>

            <div className="border-base-300 bg-base-100/90 flex justify-end gap-3 border-t px-6 py-4">
              <button
                className="btn btn-ghost"
                type="button"
                disabled={submitting}
                onClick={() => setOpen(false)}
              >
                {cancelLabel}
              </button>
              <button
                className={confirmClassName}
                type="button"
                disabled={submitting || !value.trim()}
                onClick={() => void handleConfirm()}
              >
                {submitting ? "Working..." : confirmLabel}
              </button>
            </div>
          </div>

          <button
            className="modal-backdrop"
            type="button"
            aria-label="Close prompt dialog"
            onClick={() => {
              if (!submitting) {
                setOpen(false);
              }
            }}
          />
        </dialog>
      ) : null}
    </>
  );
}
