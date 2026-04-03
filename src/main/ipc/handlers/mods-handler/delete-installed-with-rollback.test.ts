import test from "node:test";
import assert from "node:assert/strict";
import { deleteInstalledWithRollback } from "./delete-installed-with-rollback.ts";

const settings = {
  modsFolder: "C:/Factorio/mods",
  modListProfiles: [{ id: "default", name: "Default" }],
  activeModListProfileId: "default",
};

test("deleteInstalledWithRollback restores the mod-list entry when archive deletion fails", async () => {
  const removed: string[] = [];
  const restored: Array<{
    name: string;
    enabled: boolean;
    version?: string | undefined;
  }> = [];

  await assert.rejects(
    () =>
      deleteInstalledWithRollback({
        settings,
        modName: "quality",
        filePath: "C:/Factorio/mods/quality_1.0.0.zip",
        readModList: async () => [
          { name: "base", enabled: true },
          { name: "quality", enabled: true, version: "1.0.0" },
        ],
        removeEntry: async (_settings, modName) => {
          removed.push(modName);
        },
        restoreEntry: async (_settings, entry) => {
          restored.push(entry);
        },
        deleteArchive: async () => {
          throw new Error("unlink failed");
        },
      }),
    /unlink failed/,
  );

  assert.deepEqual(removed, ["quality"]);
  assert.deepEqual(restored, [
    { name: "quality", enabled: true, version: "1.0.0" },
  ]);
});
