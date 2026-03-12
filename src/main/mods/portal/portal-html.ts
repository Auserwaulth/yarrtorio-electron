import type { PortalDetailsExtras } from "./portal-types";

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function cleanPortalValue(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = decodeHtmlEntities(value).trim();

  if (!trimmed || trimmed.toUpperCase() === "N/A") {
    return undefined;
  }

  return trimmed;
}

export function extractPortalExtras(html: string): PortalDetailsExtras {
  const images = Array.from(
    html.matchAll(/https:\/\/assets-mod\.factorio\.com\/assets\/[^"'\s<]+/g),
    (match) => match[0],
  );

  const sourceUrl = cleanPortalValue(
    html.match(/Source:\s*<\/[^>]+>\s*<a[^>]+href="([^"]+)"/i)?.[1],
  );

  const homepageUrl = cleanPortalValue(
    html.match(/Homepage:\s*<\/[^>]+>\s*<a[^>]+href="([^"]+)"/i)?.[1],
  );

  const licenseMatch = html.match(
    /License:\s*<\/[^>]+>\s*(?:<a[^>]+href="([^"]+)"[^>]*>)?([^<\n]+)(?:<\/a>)?/i,
  );

  const uniqueImages = Array.from(
    new Set(images.map((image) => decodeHtmlEntities(image))),
  );

  const resolvedLicenseName = cleanPortalValue(licenseMatch?.[2]);
  const resolvedLicenseUrl = cleanPortalValue(licenseMatch?.[1]);

  return {
    ...(sourceUrl !== undefined ? { sourceUrl } : {}),
    ...(homepageUrl !== undefined ? { homepageUrl } : {}),
    ...(resolvedLicenseName !== undefined
      ? { licenseName: resolvedLicenseName }
      : {}),
    ...(resolvedLicenseUrl !== undefined
      ? { licenseUrl: resolvedLicenseUrl }
      : {}),
    images: uniqueImages,
  };
}
