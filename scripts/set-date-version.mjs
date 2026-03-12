import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packageJsonPath = resolve("package.json");

function getManilaDateParts() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
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

async function main() {
  const raw = await readFile(packageJsonPath, "utf8");
  const pkg = JSON.parse(raw);

  const { year, month, day } = getManilaDateParts();

  const nextVersion = `${year}.${month}.${day}`;

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
