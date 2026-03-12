import { FACTORIO_API_BASE } from "@shared/constants";
import type { FactorioVersion, ModSummary } from "@shared/types/mod";
import { fetchJson } from "../../utils/fetch-json";
import { extractPortalExtras } from "./portal-html";
import { mapSummary } from "./portal-mappers";
import type {
  ApiBrowseResponse,
  ApiMod,
  PortalDetailsExtras,
} from "./portal-types";

export async function fetchBrowseDatasetFromApi(
  version: FactorioVersion,
  includeDeprecated: boolean,
): Promise<ModSummary[]> {
  const query = new URLSearchParams({
    page_size: "max",
    ...(version !== "any" ? { version } : {}),
    ...(includeDeprecated ? {} : { hide_deprecated: "true" }),
  });

  const response = await fetchJson<ApiBrowseResponse>(
    `${FACTORIO_API_BASE}/mods?${query}`,
  );

  return response.results.map(mapSummary);
}

export async function fetchModFull(modName: string): Promise<ApiMod> {
  return fetchJson<ApiMod>(
    `${FACTORIO_API_BASE}/mods/${encodeURIComponent(modName)}/full`,
  );
}

export async function fetchPortalExtras(
  modName: string,
): Promise<PortalDetailsExtras> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;

  try {
    response = await fetch(getPortalUrl(modName), {
      headers: { "User-Agent": "Yarrtorio/0.1.0" },
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Factorio Mod Portal request timed out. Please try again.");
    }
    throw new Error("Factorio Mod Portal could not be reached.");
  }

  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Factorio Mod Portal request failed with ${response.status}.`);
  }

  const html = await response.text();
  return extractPortalExtras(html);
}

export function getPortalUrl(modName: string): string {
  return `https://mods.factorio.com/mod/${encodeURIComponent(modName)}`;
}
