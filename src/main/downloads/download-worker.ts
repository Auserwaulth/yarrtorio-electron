import { join } from "node:path";
import { cleanupTemp, streamDownload, validateZip } from "./stream-download";
import { createStagingPath, replaceAfterValidation } from "./update-staging";
import type { DownloadProgress, DownloadRequest } from "@shared/types/mod";

/**
 * Executes a single download job from fetch to validated final archive.
 *
 * The file is first streamed into a staging path, validated as a ZIP archive,
 * and then atomically moved into its final destination. When `replaceExisting`
 * is enabled, the prior installed archive is removed only after the new file
 * has been downloaded and validated successfully.
 *
 * @param request - Download job request describing the target mod/version and
 * destination folder.
 * @param report - Callback used to publish partial progress updates while the
 * archive is streaming.
 * @returns The final archive path after the download has been validated and
 * placed in the target folder.
 */
export async function runDownloadJob(
  request: DownloadRequest,
  report: (patch: Partial<DownloadProgress>) => void,
): Promise<string> {
  const finalName = `${request.modName}_${request.version}.zip`;
  const finalPath = join(request.targetFolder, finalName);
  const stagingPath = createStagingPath(finalPath);
  const mirrorUrl = `https://mods-storage.re146.dev/${encodeURIComponent(request.modName)}/${encodeURIComponent(request.version)}.zip`;

  try {
    await streamDownload(mirrorUrl, stagingPath, report);
    await validateZip(stagingPath);
    await replaceAfterValidation(
      stagingPath,
      finalPath,
      request.replaceExisting ? request.existingFilePath : undefined,
    );
    return finalPath;
  } catch (error) {
    await cleanupTemp(stagingPath);
    throw error;
  }
}
