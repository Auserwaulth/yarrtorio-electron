import type { BentoShellProps } from "./bento-shell.types";

/**
 * A layout shell component that provides the main application structure
 * with a sidebar on the left and main content area on the right.
 * Uses a responsive grid layout that switches to a single column on smaller screens.
 *
 * @param sidebar - The sidebar content to display on the left
 * @param children - The main content to display on the right
 *
 * @example
 * <BentoShell sidebar={<Navigation />}>
 *   <BentoTile title="Mods">
 *     <ModList />
 *   </BentoTile>
 * </BentoShell>
 */
export function BentoShell({ sidebar, header, children }: BentoShellProps) {
  return (
    <div className="app-shell-bg min-h-screen p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
        <aside className="lg:row-span-2 lg:self-start">{sidebar}</aside>
        <div className="min-w-0">{header}</div>
        <main className="min-w-0 space-y-4">{children}</main>
      </div>
    </div>
  );
}
