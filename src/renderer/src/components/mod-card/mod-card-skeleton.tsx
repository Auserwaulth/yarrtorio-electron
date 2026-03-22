export function ModCardSkeleton() {
  return (
    <article className="card border-base-300 bg-base-100 overflow-hidden border shadow-lg">
      <div className="skeleton h-44 w-full" />

      <div className="card-body gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-4 w-24" />
          </div>
          <div className="skeleton h-5 w-16" />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="skeleton h-5 w-20" />
          <div className="skeleton h-5 w-24" />
        </div>

        <div className="space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-4/6" />
        </div>

        <hr />

        <div className="flex gap-2">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3 w-16" />
        </div>

        <div className="card-actions justify-end">
          <div className="skeleton h-8 w-20" />
        </div>
      </div>
    </article>
  );
}
