interface ModListEntryLike {
  name: string;
  enabled: boolean;
  version?: string | undefined;
}

interface ModSettingsLike {
  modsFolder: string;
  modListProfiles: { id: string; name: string }[];
  activeModListProfileId: string;
}

export interface DeleteInstalledWithRollbackOptions {
  settings: ModSettingsLike;
  modName: string;
  filePath: string;
  readModList: (settings: ModSettingsLike) => Promise<ModListEntryLike[]>;
  removeEntry: (settings: ModSettingsLike, modName: string) => Promise<void>;
  restoreEntry: (
    settings: ModSettingsLike,
    entry: ModListEntryLike,
  ) => Promise<void>;
  deleteArchive: (filePath: string) => Promise<void>;
}

export async function deleteInstalledWithRollback({
  settings,
  modName,
  filePath,
  readModList,
  removeEntry,
  restoreEntry,
  deleteArchive,
}: DeleteInstalledWithRollbackOptions): Promise<void> {
  const existingEntry = (await readModList(settings)).find(
    (item) => item.name === modName,
  );

  await removeEntry(settings, modName);

  try {
    await deleteArchive(filePath);
  } catch (error) {
    if (existingEntry) {
      await restoreEntry(settings, existingEntry);
    }

    throw error;
  }
}
