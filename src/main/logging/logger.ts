import { app } from "electron";
import { appendFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  details?: unknown;
  context?: Record<string, unknown> | undefined;
}

const MAX_LOG_FILES = 7; // Keep 7 days of logs

function getLogDir(): string {
  return join(app.getPath("userData"), "logs");
}

function getTodayLogFile(): string {
  const date = new Date().toISOString().split("T")[0];
  return join(getLogDir(), `yarrtorio-${date}.log`);
}

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
  return getTodayLogFile();
}

async function cleanOldLogs(): Promise<void> {
  try {
    const logDir = getLogDir();
    const files = await readdir(logDir);
    const logFiles = files
      .filter((f) => f.startsWith("yarrtorio-") && f.endsWith(".log"))
      .sort()
      .reverse();

    // Remove old files beyond MAX_LOG_FILES
    if (logFiles.length > MAX_LOG_FILES) {
      const toDelete = logFiles.slice(MAX_LOG_FILES);
      await Promise.all(
        toDelete.map((file) => rm(join(logDir, file), { force: true })),
      );
    }
  } catch {
    // Ignore cleanup errors
  }
}

async function writeLog(entry: LogEntry): Promise<void> {
  const logFile = getTodayLogFile();

  try {
    await mkdir(dirname(logFile), { recursive: true });
    await appendFile(logFile, JSON.stringify(entry) + "\n", "utf8");
  } catch (logError) {
    const fallback: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      scope: "logger",
      message: "Failed to write log",
      details: normalizeError(logError),
    };
    console.error(JSON.stringify(fallback));
  }

  // Also output to console with appropriate level
  const consoleMsg = `[${entry.scope}] ${entry.message}`;
  switch (entry.level) {
    case "error":
      console.error(consoleMsg, entry.details ?? "");
      break;
    case "warn":
      console.warn(consoleMsg, entry.details ?? "");
      break;
    case "debug":
      console.debug(consoleMsg, entry.details ?? "");
      break;
    default:
      console.log(consoleMsg, entry.details ?? "");
  }
}

export async function logDebug(
  scope: string,
  message: string,
  details?: unknown,
  context?: Record<string, unknown> | undefined,
): Promise<void> {
  await writeLog({
    timestamp: new Date().toISOString(),
    level: "debug",
    scope,
    message,
    details,
    context,
  });
}

export async function logInfo(
  scope: string,
  message: string,
  details?: unknown,
  context?: Record<string, unknown> | undefined,
): Promise<void> {
  await writeLog({
    timestamp: new Date().toISOString(),
    level: "info",
    scope,
    message,
    details,
    context,
  });
}

export async function logWarn(
  scope: string,
  message: string,
  details?: unknown,
  context?: Record<string, unknown> | undefined,
): Promise<void> {
  await writeLog({
    timestamp: new Date().toISOString(),
    level: "warn",
    scope,
    message,
    details,
    context,
  });
}

export async function logError(
  scope: string,
  message: string,
  details?: unknown,
  context?: Record<string, unknown> | undefined,
): Promise<void> {
  await writeLog({
    timestamp: new Date().toISOString(),
    level: "error",
    scope,
    message,
    details,
    context,
  });

  // Trigger cleanup on errors
  cleanOldLogs();
}

// Initialize log directory and cleanup old logs on startup
export async function initLogger(): Promise<void> {
  await mkdir(getLogDir(), { recursive: true });
  await cleanOldLogs();
}
