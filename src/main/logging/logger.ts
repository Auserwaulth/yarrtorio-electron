import { app } from "electron";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export type LogLevel = "info" | "warn" | "error";

const logFilePath = join(app.getPath("userData"), "logs", "yarrtorio.log");

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export function getLogFilePath(): string {
  return logFilePath;
}

export async function writeLog(
  level: LogLevel,
  scope: string,
  message: string,
  details?: unknown,
): Promise<void> {
  const timestamp = new Date().toISOString();
  const block = [
    `[${timestamp}] [${level.toUpperCase()}] [${scope}] ${message}`,
    details === undefined ? null : normalizeError(details),
    "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await mkdir(dirname(logFilePath), { recursive: true });
    await appendFile(logFilePath, `${block}\n`, "utf8");
  } catch (logError) {
    const fallback = `[Yarrtorio logger failed] ${normalizeError(logError)}`;

    if (level === "error") {
      console.error(fallback);
    } else if (level === "warn") {
      console.warn(fallback);
    } else {
      console.log(fallback);
    }
  }

  if (level === "error") {
    console.error(`[${scope}] ${message}`, details);
  } else if (level === "warn") {
    console.warn(`[${scope}] ${message}`, details);
  } else {
    console.log(`[${scope}] ${message}`);
  }
}

export async function logInfo(
  scope: string,
  message: string,
  details?: unknown,
): Promise<void> {
  await writeLog("info", scope, message, details);
}

export async function logWarn(
  scope: string,
  message: string,
  details?: unknown,
): Promise<void> {
  await writeLog("warn", scope, message, details);
}

export async function logError(
  scope: string,
  message: string,
  details?: unknown,
): Promise<void> {
  await writeLog("error", scope, message, details);
}
