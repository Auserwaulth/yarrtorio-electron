import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packageJsonPath = resolve("package.json");

/**
 * Reads the current UTC date so generated versions stay timezone-neutral.
 */
function getUtcDateParts() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

/**
 * Builds the next CalVer string using UTC date plus an optional same-day patch
 * counter. The first release on a date is `YYYY.M.D`; additional releases on
 * the same date become `YYYY.M.D.1`, `YYYY.M.D.2`, and so on.
 */
function getNextVersion(currentVersion, dateVersion) {
  if (currentVersion === dateVersion) {
    return `${dateVersion}.1`;
  }

  if (currentVersion.startsWith(`${dateVersion}.`)) {
    const suffix = currentVersion.slice(dateVersion.length + 1);
    const patch = Number.parseInt(suffix, 10);

    if (Number.isFinite(patch) && patch >= 1) {
      return `${dateVersion}.${patch + 1}`;
    }
  }

  return dateVersion;
}

/** Updates `package.json` to match the current UTC date-based version. */
async function main() {
  const raw = await readFile(packageJsonPath, "utf8");
  const pkg = JSON.parse(raw);

  const { year, month, day } = getUtcDateParts();

  const dateVersion = `${year}.${month}.${day}`;
  const nextVersion = getNextVersion(pkg.version, dateVersion);

  if (pkg.version !== nextVersion) {
    pkg.version = nextVersion;
    await writeFile(
      packageJsonPath,
      `${JSON.stringify(pkg, null, 2)}\n`,
      "utf8",
    );
    console.log(`package.json version updated to ${nextVersion}`);
    return;
  }

  console.log(`package.json version already ${nextVersion}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
