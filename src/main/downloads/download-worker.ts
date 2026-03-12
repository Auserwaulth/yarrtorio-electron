import { join } from "node:path";
import { cleanupTemp, streamDownload, validateZip } from "./stream-download";
import { createStagingPath, replaceAfterValidation } from "./update-staging";
import type { DownloadProgress, DownloadRequest } from "@shared/types/mod";

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
