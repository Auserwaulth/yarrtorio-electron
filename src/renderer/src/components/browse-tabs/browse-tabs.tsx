import { modPortalTabs, type ModPortalTab } from "@shared/types/mod";

/**
 * Props for the BrowseTabs component
 */
interface BrowseTabsProps {
  /** The currently selected tab */
  value: ModPortalTab;
  /** Callback when a tab is selected */
  onChange(value: ModPortalTab): void;
}

const labels: Record<ModPortalTab, string> = {
  recently_updated: "Updated",
  most_downloaded: "Popular",
  trending: "Trending",
  highlighted: "Highlighted",
  search: "Search",
};

/**
 * A tab navigation component for browsing Factorio mods.
 * Displays tabs for different mod portal categories: Updated, Popular, Trending, Highlighted, and Search.
 *
 * @param props - Component props
 * @param props.value - The currently selected tab
 * @param props.onChange - Callback when a new tab is selected
 *
 * @example
 * <BrowseTabs
 *   value="most_downloaded"
 *   onChange={(tab) => setActiveTab(tab)}
 * />
 */
export function BrowseTabs({ value, onChange }: BrowseTabsProps) {
  return (
    <div className="tabs tabs-box bg-base-200/70 flex-wrap gap-2 p-2">
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
