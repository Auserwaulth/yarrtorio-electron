import type { ModDependency } from "@shared/types/mod";
import {
  DEPENDENCY_BADGE_CLASS,
  DEPENDENCY_KIND_LABELS,
  describeDependency,
} from "../utils";

/**
 * Props for the DependencyList component
 */
interface DependencyListProps {
  /** The title of the dependency section */
  title: string;
  /** Optional description for the dependency section */
  description?: string;
  /** Text to display when there are no dependencies */
  emptyLabel: string;
  /** Array of dependencies to display */
  items: ModDependency[];
}

/**
 * A component that displays a list of mod dependencies with their
 * kind badges and download status.
 *
 * @param props - Component props
 * @param props.title - The title of the dependency section
 * @param props.description - Optional description
 * @param props.emptyLabel - Text to show when no items
 * @param props.items - Array of dependencies to display
 *
 * @example
 * <DependencyList
 *   title="Required"
 *   description="Needed for the mod to work."
 *   emptyLabel="No required dependencies."
 *   items={dependencies}
 * />
 */
export function DependencyList({
  title,
  description,
  emptyLabel,
  items,
}: DependencyListProps) {
  return (
    <section className="bg-base-200 space-y-3 rounded-2xl p-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base-content/75 text-sm font-bold tracking-wide uppercase">
            {title}
          </h4>
          <span className="badge badge-outline">{items.length}</span>
        </div>
        {description ? (
          <p className="text-base-content/60 text-sm">{description}</p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="border-base-content/15 text-base-content/55 rounded-xl border border-dashed px-3 py-4 text-sm">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((dependency) => (
            <div
              key={`${dependency.kind}-${dependency.raw}`}
              className="bg-base-100 rounded-xl px-3 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {describeDependency(dependency)}
                </span>
                <span
                  className={`badge badge-soft ${DEPENDENCY_BADGE_CLASS[dependency.kind]}`}
                >
                  {DEPENDENCY_KIND_LABELS[dependency.kind]}
                </span>
                {dependency.downloadable ? (
                  <span className="badge badge-success badge-outline">
                    Downloadable
                  </span>
                ) : (
                  <span className="badge badge-warning badge-outline">
                    Not auto-downloaded
                  </span>
                )}
              </div>

              {dependency.reasonSkipped ? (
                <p className="text-base-content/60 mt-2 text-sm">
                  {dependency.reasonSkipped}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
