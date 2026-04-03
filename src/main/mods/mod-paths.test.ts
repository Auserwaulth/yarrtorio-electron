import test from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  ensureConfiguredModsFolder,
  resolveArchivePathWithinFolder,
  resolvePathWithinFolder,
} from "./mod-paths.ts";

test("ensureConfiguredModsFolder rejects an empty folder", () => {
  assert.throws(
    () => ensureConfiguredModsFolder(""),
    /Mods folder is not configured\./,
  );
});

test("ensureConfiguredModsFolder rejects a relative folder", () => {
  assert.throws(
    () => ensureConfiguredModsFolder("mods"),
    /must be an absolute path\./,
  );
});

test("resolvePathWithinFolder allows descendants only", () => {
  const folder = resolve(tmpdir(), `mods-${Date.now()}`);
  const child = resolvePathWithinFolder(folder, "subdir/mod.zip");

  assert.equal(child, resolve(folder, "subdir/mod.zip"));
  assert.throws(
    () => resolvePathWithinFolder(folder, "../escape.zip"),
    /configured mods folder/i,
  );
});

test("resolveArchivePathWithinFolder rejects nested paths and non-zip files", () => {
  const folder = resolve(tmpdir(), `mods-${Date.now()}`);

  assert.throws(
    () => resolveArchivePathWithinFolder(folder, "nested/mod.zip"),
    /must stay inside the configured mods folder/i,
  );
  assert.throws(
    () => resolveArchivePathWithinFolder(folder, "mod.txt"),
    /\.zip file/i,
  );
});
