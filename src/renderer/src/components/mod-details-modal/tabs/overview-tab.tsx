import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { OverviewTabProps } from "../types";

export function OverviewTab({
  description,
  descExpanded,
  onOpenExternal,
  onToggleExpanded,
  summary,
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {summary ? (
        <div className="bg-base-200 rounded-2xl p-4">
          <p className="text-base-content/80 text-sm leading-relaxed">
            {summary}
          </p>
        </div>
      ) : null}

      <div className="bg-base-200 rounded-2xl p-5">
        <div
          className={`prose prose-sm text-base-content max-w-none ${
            descExpanded ? "" : "max-h-72 overflow-hidden"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const url = typeof href === "string" ? href : undefined;

                return (
                  <button
                    type="button"
                    className="text-primary cursor-pointer underline"
                    onClick={() => {
                      if (url) {
                        void onOpenExternal(url);
                      }
                    }}
                  >
                    {children}
                  </button>
                );
              },
            }}
          >
            {description || "No description provided."}
          </ReactMarkdown>
        </div>

        {description ? (
          <div className="mt-4">
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={onToggleExpanded}
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
