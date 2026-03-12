import type {
  BrowseFilters,
  FactorioVersion,
  ModCategory,
  ModPortalTab,
  ModTag,
} from "@shared/types/mod";

export const defaultBrowseFilters: BrowseFilters = {
  query: "",
  page: 1,
  pageSize: 24,
  tab: "recently_updated",
  version: "2.0",
  categories: [],
  includeCategories: true,
  tags: [],
  includeTags: true,
  includeDeprecated: false,
};

export type BrowseAction =
  | { type: "set-query"; value: string }
  | { type: "set-tab"; value: ModPortalTab }
  | { type: "set-version"; value: FactorioVersion }
  | { type: "toggle-category"; value: ModCategory }
  | { type: "toggle-tag"; value: ModTag }
  | { type: "set-page"; value: number }
  | { type: "set-include-categories"; value: boolean }
  | { type: "set-include-tags"; value: boolean }
  | { type: "set-include-deprecated"; value: boolean }
  | { type: "reset" };

function toggleValue<T extends string>(items: readonly T[], value: T): T[] {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

export function browseReducer(
  state: BrowseFilters,
  action: BrowseAction,
): BrowseFilters {
  switch (action.type) {
    case "set-query":
      return { ...state, query: action.value, page: 1, tab: "search" };
    case "set-tab":
      return { ...state, tab: action.value, page: 1 };
    case "set-version":
      return { ...state, version: action.value, page: 1 };
    case "toggle-category":
      return {
        ...state,
        categories: toggleValue(state.categories, action.value),
        page: 1,
      };
    case "toggle-tag":
      return {
        ...state,
        tags: toggleValue(state.tags, action.value),
        page: 1,
      };
    case "set-page":
      return { ...state, page: action.value };
    case "set-include-categories":
      return { ...state, includeCategories: action.value, page: 1 };
    case "set-include-tags":
      return { ...state, includeTags: action.value, page: 1 };
    case "set-include-deprecated":
      return { ...state, includeDeprecated: action.value, page: 1 };
    case "reset":
      return { ...defaultBrowseFilters };
    default:
      return state;
  }
}
