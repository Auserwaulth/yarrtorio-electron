import { getDisplayUrl } from "../utils";

interface InfoLinkProps {
  label: string;
  onOpen(url: string): void | Promise<void>;
  url?: string | undefined;
  value?: string | undefined;
}

export function InfoLink({ label, onOpen, url, value }: InfoLinkProps) {
  if (!url && !value) return null;

  const displayValue = value ?? (url ? getDisplayUrl(url) : "");
  if (!displayValue) return null;

  return (
    <div className="rounded-xl bg-base-100/70 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
        {label}
      </p>

      {url ? (
        <button
          type="button"
          className="mt-1 block break-all text-left text-sm text-primary hover:underline"
          onClick={() => onOpen(url)}
        >
          {displayValue}
        </button>
      ) : (
        <p className="mt-1 break-all text-sm text-base-content/80">
          {displayValue}
        </p>
      )}
    </div>
  );
}
