import { modPortalTabs, type ModPortalTab } from "@shared/types/mod";

interface BrowseTabsProps {
  value: ModPortalTab;
  onChange(value: ModPortalTab): void;
}

const labels: Record<ModPortalTab, string> = {
  recently_updated: "Updated",
  most_downloaded: "Popular",
  trending: "Trending",
  highlighted: "Highlighted",
  search: "Search",
};

export function BrowseTabs({ value, onChange }: BrowseTabsProps) {
  return (
    <div className="tabs tabs-box flex-wrap gap-2 bg-base-200/70 p-2">
      {modPortalTabs.map((tab) => (
        <button
          key={tab}
          className={`tab ${value === tab ? "tab-active" : ""}`}
          onClick={() => onChange(tab)}
          type="button"
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
