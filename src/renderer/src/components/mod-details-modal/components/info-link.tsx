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
    <div className="bg-base-100/70 rounded-xl px-3 py-2">
      <p className="text-base-content/50 text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </p>

      {url ? (
        <button
          type="button"
          className="text-primary mt-1 block text-left text-sm break-all hover:underline"
          onClick={() => onOpen(url)}
        >
          {displayValue}
        </button>
      ) : (
        <p className="text-base-content/80 mt-1 text-sm break-all">
          {displayValue}
        </p>
      )}
    </div>
  );
}
