import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  buildUniqueProfileName,
  compareProfileContents,
  readProfileExportPackage,
  sanitizeProfileFileName,
  writeProfileExportPackage,
} from "./mod-list-profile-transfer.ts";
import type { ModListProfile } from "../../shared/types/mod.ts";

test("buildUniqueProfileName keeps imported profile names unique", () => {
  assert.equal(
    buildUniqueProfileName(["Alpha", "Alpha (2)"], "  Alpha  "),
    "Alpha (3)",
  );
  assert.equal(buildUniqueProfileName([], "   "), "Imported profile");
});

test("sanitizeProfileFileName removes unsafe path characters", () => {
  assert.equal(sanitizeProfileFileName("My:Profile/Name?"), "My_Profile_Name_");
});

test("compareProfileContents reports shared, changed, and unique mods", () => {
  const leftProfile: ModListProfile = { id: "left", name: "Left" };
  const rightProfile: ModListProfile = { id: "right", name: "Right" };

  const diff = compareProfileContents(
    leftProfile,
    rightProfile,
    [
      { name: "base", enabled: true },
      { name: "alpha", enabled: true, version: "1.0.0" },
      { name: "legacy", enabled: false },
    ],
    [
      { name: "base", enabled: true },
      { name: "alpha", enabled: false, version: "1.0.0" },
      { name: "extra", enabled: true },
    ],
  );

  assert.equal(diff.leftProfile, leftProfile);
  assert.equal(diff.rightProfile, rightProfile);
  assert.equal(diff.leftCount, 3);
  assert.equal(diff.rightCount, 3);
  assert.equal(diff.sameCount, 1);
  assert.deepEqual(diff.changed, [
    {
      name: "alpha",
      left: { name: "alpha", enabled: true, version: "1.0.0" },
      right: { name: "alpha", enabled: false, version: "1.0.0" },
    },
  ]);
  assert.deepEqual(
    diff.added.map((entry: { name: string }) => entry.name),
    ["extra"],
  );
  assert.deepEqual(
    diff.removed.map((entry: { name: string }) => entry.name),
    ["legacy"],
  );
});

test("writeProfileExportPackage round-trips a profile export package", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "yarrtorio-profile-transfer-"));
  const filePath = join(workspace, "profile.json");

  try {
    await writeProfileExportPackage(filePath, "  Example Profile  ", [
      { name: "alpha", enabled: true },
    ]);

    const raw = JSON.parse(await readFile(filePath, "utf8")) as {
      version: number;
      profile: { name: string };
      mods: Array<{ name: string; enabled: boolean }>;
    };

    assert.deepEqual(raw, {
      version: 1,
      profile: {
        name: "Example Profile",
      },
      mods: [
        { name: "base", enabled: true },
        { name: "alpha", enabled: true },
      ],
    });

    const imported = await readProfileExportPackage(filePath);

    assert.deepEqual(imported, {
      version: 1,
      profile: {
        name: "Example Profile",
      },
      mods: [
        { name: "base", enabled: true },
        { name: "alpha", enabled: true },
      ],
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("readProfileExportPackage rejects duplicate mod entries", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "yarrtorio-profile-transfer-"));
  const filePath = join(workspace, "duplicate.json");

  try {
    await writeFile(
      filePath,
      JSON.stringify(
        {
          version: 1,
          profile: {
            name: "Duplicate",
          },
          mods: [
            { name: "base", enabled: true },
            { name: "alpha", enabled: true },
            { name: "alpha", enabled: false },
          ],
        },
        null,
        2,
      ),
      "utf8",
    );

    await assert.rejects(
      () => readProfileExportPackage(filePath),
      /duplicate mod entries/i,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
