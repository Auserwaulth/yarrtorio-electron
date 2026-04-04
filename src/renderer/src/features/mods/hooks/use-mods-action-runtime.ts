import { useRef, useState } from "react";
import type { AppStore } from "../../../store/app-store";
import type {
  ModsActionOptions,
  ModsActionRuntime,
} from "./use-mods-action-types";

export function useModsActionRuntime(
  setStore: React.Dispatch<React.SetStateAction<AppStore>>,
  modsFolder: string,
  options: ModsActionOptions = {},
): ModsActionRuntime {
  const [browseBusyCount, setBrowseBusyCount] = useState(0);
  const [installedBusyCount, setInstalledBusyCount] = useState(0);
  const [pendingInstalledModNames, setPendingInstalledModNames] = useState<
    string[]
  >([]);
  const latestBrowseRequestId = useRef(0);
  const latestSelectedModRequestId = useRef(0);

  function reportError(message: string) {
    options.onError?.(message);
  }

  function formatModNameList(modNames: string[]): string {
    if (modNames.length <= 3) {
      return modNames.join(", ");
    }

    return `${modNames.slice(0, 3).join(", ")} and ${modNames.length - 3} more`;
  }

  async function runWithBrowseBusy<T>(task: () => Promise<T>): Promise<T> {
    setBrowseBusyCount((current) => current + 1);

    try {
      return await task();
    } finally {
      setBrowseBusyCount((current) => Math.max(0, current - 1));
    }
  }

  async function runWithInstalledBusy<T>(task: () => Promise<T>): Promise<T> {
    setInstalledBusyCount((current) => current + 1);

    try {
      return await task();
    } finally {
      setInstalledBusyCount((current) => Math.max(0, current - 1));
    }
  }

  async function runWithPendingInstalledMods<T>(
    modNames: string[],
    task: () => Promise<T>,
  ): Promise<T> {
    const uniqueModNames = Array.from(new Set(modNames));
    setPendingInstalledModNames((current) =>
      Array.from(new Set([...current, ...uniqueModNames])),
    );

    try {
      return await task();
    } finally {
      setPendingInstalledModNames((current) =>
        current.filter((name) => !uniqueModNames.includes(name)),
      );
    }
  }

  return {
    setStore,
    modsFolder,
    options,
    browseBusy: browseBusyCount > 0,
    installedBusy: installedBusyCount > 0,
    pendingInstalledModNames,
    latestBrowseRequestId,
    latestSelectedModRequestId,
    reportError,
    formatModNameList,
    runWithBrowseBusy,
    runWithInstalledBusy,
    runWithPendingInstalledMods,
  };
}
