import type { BentoTileProps } from "./bento-tile.types";

export function BentoTile({
  title,
  action,
  className = "",
  children,
}: BentoTileProps) {
  return (
    <section
      className={[
        "card relative overflow-hidden border border-base-300/70 bg-linear-to-br from-base-100 via-base-100 to-base-200/80 shadow-xl shadow-base-content/5 backdrop-blur",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/10 via-secondary/5 to-transparent" />
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
