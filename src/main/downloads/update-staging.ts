import { access, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Creates a temporary sibling path for a staged download archive.
 *
 * The file stays in the same directory as the final target so the eventual
 * rename remains an atomic filesystem move.
 */
export function createStagingPath(targetFilePath: string): string {
  return join(
    dirname(targetFilePath),
    `.yarrtorio-staging-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`,
  );
}

/**
 * Promotes a validated staging file into place and cleans up the prior file.
 *
 * The old file is only removed when it is distinct from the target path so the
 * replacement flow stays safe for in-place updates.
 */
export async function replaceAfterValidation(
  stagingPath: string,
  targetFilePath: string,
  previousFilePath?: string,
): Promise<void> {
  let backupPath: string | null = null;

  try {
    await access(targetFilePath);
    backupPath = join(
      dirname(targetFilePath),
      `.yarrtorio-backup-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`,
    );
    await rename(targetFilePath, backupPath);
  } catch {
    backupPath = null;
  }

  try {
    await rename(stagingPath, targetFilePath);
    if (backupPath) {
      await unlink(backupPath).catch(() => undefined);
    }

    if (previousFilePath && previousFilePath !== targetFilePath) {
      await unlink(previousFilePath).catch(() => undefined);
    }
  } catch (error) {
    if (backupPath) {
      await unlink(targetFilePath).catch(() => undefined);
      await rename(backupPath, targetFilePath).catch(() => undefined);
      await unlink(backupPath).catch(() => undefined);
    }

    throw error;
  }
}
