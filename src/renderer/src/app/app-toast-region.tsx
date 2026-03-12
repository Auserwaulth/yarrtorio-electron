import type { ToastItem } from "../hooks/use-toast-center";

interface AppToastRegionProps {
  toasts: ToastItem[];
  positionClass: string;
}

export function AppToastRegion({ toasts, positionClass }: AppToastRegionProps) {
  return (
    <div className={`toast ${positionClass} z-1000`}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`alert shadow-lg ${
            toast.tone === "success"
              ? "alert-success"
              : toast.tone === "error"
                ? "alert-error"
                : "alert-info"
          }`}
        >
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
}
