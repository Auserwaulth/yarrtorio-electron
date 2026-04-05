import assert from "node:assert/strict";
import test from "node:test";
import {
  filterManagedMods,
  filterSyncCandidates,
  isManagedModName,
} from "./disabled-mods.ts";

test("isManagedModName excludes Factorio base and expansion entries", () => {
  assert.equal(isManagedModName("base"), false);
  assert.equal(isManagedModName("space-age"), false);
  assert.equal(isManagedModName("quality"), false);
  assert.equal(isManagedModName("my-custom-mod"), true);
});

test("filterSyncCandidates removes default skipped mods but keeps disabled entries", () => {
  const entries = [
    { name: "base", enabled: true },
    { name: "space-age", enabled: true },
    { name: "alpha", enabled: false },
    { name: "beta", enabled: true },
  ];

  assert.deepEqual(filterSyncCandidates(entries), [
    { name: "alpha", enabled: false },
    { name: "beta", enabled: true },
  ]);
});

test("filterManagedMods excludes disabled entries only when includeDisabled is false", () => {
  const entries = [
    { name: "base", enabled: true },
    { name: "alpha", enabled: false },
    { name: "beta", enabled: true },
  ];

  assert.deepEqual(filterManagedMods(entries, false), [
    { name: "beta", enabled: true },
  ]);
  assert.deepEqual(filterManagedMods(entries, true), [
    { name: "alpha", enabled: false },
    { name: "beta", enabled: true },
  ]);
});
