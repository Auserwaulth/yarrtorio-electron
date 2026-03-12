import { rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";

export function createStagingPath(targetFilePath: string): string {
  return join(
    dirname(targetFilePath),
    `.yarrtorio-staging-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`,
  );
}

export async function replaceAfterValidation(
  stagingPath: string,
  targetFilePath: string,
  previousFilePath?: string,
): Promise<void> {
  if (previousFilePath && previousFilePath !== targetFilePath) {
    await unlink(previousFilePath).catch(() => undefined);
  }
  await rename(stagingPath, targetFilePath);
}
