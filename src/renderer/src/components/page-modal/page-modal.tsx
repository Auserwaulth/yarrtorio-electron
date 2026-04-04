import { type ReactNode } from "react";
import { createPortal } from "react-dom";

const MODAL_ROOT_ID = "modal-root";

interface PageModalProps {
  open?: boolean;
  onClose(): void;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  backdropLabel?: string;
  closeOnBackdrop?: boolean;
}

function joinClasses(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

export function PageModal({
  open = true,
  onClose,
  children,
  className,
  panelClassName,
  backdropLabel = "Close dialog",
  closeOnBackdrop = true,
}: PageModalProps) {
  const modalRoot =
    typeof document === "undefined"
      ? null
      : document.getElementById(MODAL_ROOT_ID);

  if (!open || !modalRoot) {
    return null;
  }

  return createPortal(
    <dialog open className={joinClasses("modal modal-open px-3", className)}>
      <div
        className={joinClasses(
          "modal-box border-base-300 bg-base-100 border p-0 shadow-2xl",
          panelClassName,
        )}
      >
        {children}
      </div>

      {closeOnBackdrop ? (
        <button
          className="modal-backdrop"
          type="button"
          aria-label={backdropLabel}
          onClick={onClose}
        />
      ) : (
        <div className="modal-backdrop" aria-hidden="true" />
      )}
    </dialog>,
    modalRoot,
  );
}
