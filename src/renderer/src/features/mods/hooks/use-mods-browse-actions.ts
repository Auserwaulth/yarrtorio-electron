import type { BrowseFilters } from "@shared/types/mod";
import { modsService } from "../services/mods-service";
import type { ModsActionRuntime } from "./use-mods-action-types";

export function useModsBrowseActions(runtime: ModsActionRuntime) {
  const {
    latestBrowseRequestId,
    latestSelectedModRequestId,
    reportError,
    runWithBrowseBusy,
    setStore,
  } = runtime;

  async function browse(filters: BrowseFilters): Promise<void> {
    const requestId = latestBrowseRequestId.current + 1;
    latestBrowseRequestId.current = requestId;

    await runWithBrowseBusy(async () => {
      const result = await modsService.browse(filters);
      if (requestId !== latestBrowseRequestId.current) {
        return;
      }

      if (!result.ok) {
        reportError(result.error);
        return;
      }

      setStore((current) => ({
        ...current,
        mods: result.data.items,
        modsPagination: result.data.pagination,
      }));
    });
  }

  async function selectMod(modName: string): Promise<void> {
    const requestId = ++latestSelectedModRequestId.current;

    setStore((current) => ({
      ...current,
      selectedModPendingName: modName,
      selectedModLoading: true,
    }));

    const result = await modsService.details(modName);
    if (requestId !== latestSelectedModRequestId.current) {
      return;
    }

    if (result.ok) {
      setStore((current) => ({
        ...current,
        selectedMod: result.data,
        selectedModLoading: false,
        selectedModPendingName: null,
      }));
      return;
    }

    setStore((current) => ({
      ...current,
      selectedMod: null,
      selectedModPendingName: null,
      selectedModLoading: false,
    }));
    reportError(result.error);
  }

  function closeSelectedMod(): void {
    latestSelectedModRequestId.current += 1;
    setStore((current) => ({
      ...current,
      selectedMod: null,
      selectedModPendingName: null,
      selectedModLoading: false,
    }));
  }

  return {
    browse,
    selectMod,
    closeSelectedMod,
  };
}
