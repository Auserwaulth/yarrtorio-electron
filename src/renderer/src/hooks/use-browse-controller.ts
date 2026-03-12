import { useCallback, useMemo, useReducer } from "react";
import { browseReducer, defaultBrowseFilters } from "../state/browse-state";
import type {
  FactorioVersion,
  ModCategory,
  ModPortalTab,
  ModTag,
} from "@shared/types/mod";

export function useBrowseController() {
  const [filters, dispatch] = useReducer(browseReducer, defaultBrowseFilters);

  const actions = useMemo(
    () => ({
      setQuery: (value: string) => dispatch({ type: "set-query", value }),
      setVersion: (value: FactorioVersion) =>
        dispatch({ type: "set-version", value }),
      toggleCategory: (value: ModCategory) =>
        dispatch({ type: "toggle-category", value }),
      toggleTag: (value: ModTag) => dispatch({ type: "toggle-tag", value }),
      setIncludeCategories: (value: boolean) =>
        dispatch({ type: "set-include-categories", value }),
      setIncludeTags: (value: boolean) =>
        dispatch({ type: "set-include-tags", value }),
      setIncludeDeprecated: (value: boolean) =>
        dispatch({ type: "set-include-deprecated", value }),
      setTab: (value: ModPortalTab) => dispatch({ type: "set-tab", value }),
      setPage: (value: number) => dispatch({ type: "set-page", value }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [],
  );

  const buildFilters = useCallback(
    (nextPage?: number) => ({
      ...filters,
      page: nextPage ?? filters.page,
    }),
    [filters],
  );

  return {
    filters,
    actions,
    defaultFilters: defaultBrowseFilters,
    buildFilters,
  };
}
