import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { replaceAfterValidation } from "./update-staging.ts";

test("replaceAfterValidation keeps the previous archive when promotion fails", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "yarrtorio-update-staging-"));
  const stagingPath = join(workspace, "staging.zip");
  const previousPath = join(workspace, "previous.zip");
  const missingDirectoryTarget = join(workspace, "missing", "next.zip");

  await writeFile(stagingPath, "new", "utf8");
  await writeFile(previousPath, "old", "utf8");

  try {
    await assert.rejects(() =>
      replaceAfterValidation(stagingPath, missingDirectoryTarget, previousPath),
    );

    await assert.doesNotReject(() => access(previousPath, constants.F_OK));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("replaceAfterValidation promotes the new archive before deleting the previous one", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "yarrtorio-update-staging-"));
  const stagingPath = join(workspace, "staging.zip");
  const previousPath = join(workspace, "previous.zip");
  const targetPath = join(workspace, "next.zip");

  await writeFile(stagingPath, "new", "utf8");
  await writeFile(previousPath, "old", "utf8");

  try {
    await replaceAfterValidation(stagingPath, targetPath, previousPath);

    await assert.rejects(() => access(previousPath, constants.F_OK));
    assert.equal(await readFile(targetPath, "utf8"), "new");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
