export function formatDownloads(value?: number): string {
  if (!value) return "—";
  return Intl.NumberFormat().format(value);
}
