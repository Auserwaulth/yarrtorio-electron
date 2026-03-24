import type { BentoTileProps } from "./bento-tile.types";

/**
 * A card-like container component with a glassmorphism effect.
 * Features a title bar with optional action button and a content area.
 *
 * @example
 * <BentoTile title="Mods" action={<Button>Install</Button>}>
 *   <p>Mod content here</p>
 * </BentoTile>
 */
export function BentoTile({
  title,
  action,
  className = "",
  children,
}: BentoTileProps) {
  return (
    <section
      className={[
        "card border-base-300/70 from-base-100 via-base-100 to-base-200/80 shadow-base-content/5 relative overflow-hidden border bg-linear-to-br shadow-xl backdrop-blur",
        className,
      ].join(" ")}
    >
      <div className="from-primary/10 via-secondary/5 pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent" />
      <div className="card-body relative z-10">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="card-title text-lg">{title}</h2>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}
