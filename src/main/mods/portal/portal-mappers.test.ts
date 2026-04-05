import assert from "node:assert/strict";
import test from "node:test";
import { mapRelease, parseDependency } from "./portal-mappers.ts";

test("parseDependency identifies dependency kinds and built-in skip reasons", () => {
  assert.deepEqual(parseDependency("? helper >= 1.0.0"), {
    raw: "? helper >= 1.0.0",
    name: "helper",
    kind: "optional",
    versionConstraint: ">= 1.0.0",
    downloadable: true,
    reasonSkipped: undefined,
  });

  assert.deepEqual(parseDependency("(?) secret"), {
    raw: "(?) secret",
    name: "secret",
    kind: "hidden-optional",
    versionConstraint: undefined,
    downloadable: true,
    reasonSkipped: undefined,
  });

  assert.deepEqual(parseDependency("! enemy-mod"), {
    raw: "! enemy-mod",
    name: "enemy-mod",
    kind: "incompatible",
    versionConstraint: undefined,
    downloadable: true,
    reasonSkipped: undefined,
  });

  assert.deepEqual(parseDependency("base >= 2.0.0"), {
    raw: "base >= 2.0.0",
    name: "base",
    kind: "required",
    versionConstraint: ">= 2.0.0",
    downloadable: false,
    reasonSkipped: "Built into Factorio.",
  });
});

test("parseDependency returns a non-downloadable fallback for malformed dependency strings", () => {
  assert.deepEqual(parseDependency("@@@"), {
    raw: "@@@",
    name: "@@@",
    kind: "required",
    downloadable: false,
    reasonSkipped: "Unrecognized dependency format.",
  });
  assert.equal(parseDependency("   "), null);
});

test("mapRelease parses dependencies and ignores blank entries", () => {
  const release = mapRelease({
    version: "1.2.3",
    released_at: "2026-01-01",
    download_url: "/download/root.zip",
    file_name: "root_1.2.3.zip",
    info_json: {
      factorio_version: "2.0",
      dependencies: ["base >= 2.0.0", "dep", " ", "? helper"],
    },
  });

  assert.deepEqual(release, {
    version: "1.2.3",
    factorioVersion: "2.0",
    releasedAt: "2026-01-01",
    downloadPath: "/download/root.zip",
    fileName: "root_1.2.3.zip",
    dependencies: [
      {
        raw: "base >= 2.0.0",
        name: "base",
        kind: "required",
        versionConstraint: ">= 2.0.0",
        downloadable: false,
        reasonSkipped: "Built into Factorio.",
      },
      {
        raw: "dep",
        name: "dep",
        kind: "required",
        versionConstraint: undefined,
        downloadable: true,
        reasonSkipped: undefined,
      },
      {
        raw: "? helper",
        name: "helper",
        kind: "optional",
        versionConstraint: undefined,
        downloadable: true,
        reasonSkipped: undefined,
      },
    ],
  });
});
