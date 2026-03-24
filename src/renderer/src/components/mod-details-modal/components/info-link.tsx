import { getDisplayUrl } from "../utils";

/**
 * Props for the InfoLink component
 */
interface InfoLinkProps {
  /** The label for this info item */
  label: string;
  /** Callback when the link is clicked */
  onOpen(url: string): void | Promise<void>;
  /** The URL to link to (optional) */
  url?: string | undefined;
  /** Display value if different from URL */
  value?: string | undefined;
}

/**
 * A component that displays informational links such as source code,
 * homepage, license, or selected release. Renders as a clickable link
 * if a URL is provided, or as plain text otherwise.
 *
 * @param props - Component props
 * @param props.label - Label for the info item
 * @param props.onOpen - Callback to open URL externally
 * @param props.url - URL to link to
 * @param props.value - Custom display value
 *
 * @example
 * <InfoLink
 *   label="Source"
 *   onOpen={handleOpen}
 *   url="https://github.com/example"
 * />
 */
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
