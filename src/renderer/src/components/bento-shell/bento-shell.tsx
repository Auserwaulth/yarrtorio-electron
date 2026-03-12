import type { BentoShellProps } from "./bento-shell.types";

export function BentoShell({ sidebar, children }: BentoShellProps) {
  return (
    <div className="app-shell-bg min-h-screen p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
        <aside>{sidebar}</aside>
        <main className="space-y-4">{children}</main>
      </div>
    </div>
  );
}
