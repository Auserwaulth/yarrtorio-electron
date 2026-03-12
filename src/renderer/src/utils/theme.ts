import type { ThemeMode } from "@shared/constants/themes";

function resolveTheme(theme: ThemeMode): string {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: ThemeMode): void {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme =
    resolved === "light" || resolved === "cupcake" || resolved === "winter"
      ? "light"
      : "dark";
}
