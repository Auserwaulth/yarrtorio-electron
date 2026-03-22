export function InstalledPageSkeleton() {
  return (
    <div className="max-h-[60vh] overflow-x-auto overflow-y-auto">
      <table className="table">
        <thead className="bg-base-100 sticky top-0 z-10">
          <tr>
            <th>Name</th>
            <th>Version</th>
            <th>Enabled</th>
            <th>Archive</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i}>
              <td>
                <div className="skeleton h-4 w-32" />
              </td>
              <td>
                <div className="skeleton h-4 w-16" />
              </td>
              <td>
                <div className="skeleton toggle toggle-primary" />
              </td>
              <td className="max-w-56">
                <div className="skeleton h-4 w-48" />
              </td>
              <td>
                <div className="flex justify-end gap-2">
                  <div className="skeleton btn btn-sm w-16" />
                  <div className="skeleton btn btn-sm w-20" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
