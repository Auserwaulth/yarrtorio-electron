export const ipcChannels = {
  mods: {
    browse: "mods:browse",
    details: "mods:details",
    installed: "mods:installed",
    syncFromModList: "mods:sync-from-mod-list",
    deleteInstalled: "mods:delete-installed",
    queueUpdateInstalled: "mods:queue-update-installed",
    setEnabled: "mods:set-enabled",
  },
  downloads: {
    enqueue: "downloads:enqueue",
    list: "downloads:list",
    retry: "downloads:retry",
    subscribe: "downloads:progress",
    unsubscribe: "downloads:unsubscribe",
  },
  settings: {
    get: "settings:get",
    update: "settings:update",
    chooseFolder: "settings:choose-folder",
    chooseModListFile: "settings:choose-mod-list-file",
  },
  app: {
    meta: "app:meta",
  },
  external: {
    openUrl: "external:open-url",
    openPath: "external:open-path",
  },
} as const;
