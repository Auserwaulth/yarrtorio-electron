/**
 * Formats a download count for display.
 * Uses Intl.NumberFormat for locale-aware formatting.
 *
 * @param value - The number of downloads (optional)
 * @returns Formatted string or "—" if value is undefined/zero
 *
 * @example
 * formatDownloads(1234) // "1,234"
 * formatDownloads() // "—"
 */
export function formatDownloads(value?: number): string {
  if (!value) return "—";
  return Intl.NumberFormat().format(value);
}
