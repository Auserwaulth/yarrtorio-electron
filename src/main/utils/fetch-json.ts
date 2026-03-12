const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

function toNetworkErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Factorio API request timed out. Please try again.";
    }

    return `Factorio API request failed: ${error.message}`;
  }

  return "Factorio API request failed due to an unexpected network error.";
}

export async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DEFAULT_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Yarrtorio/0.1.0" },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status >= 500) {
        throw new Error(
          `Factorio API is unavailable right now (${response.status}).`,
        );
      }

      throw new Error(`Factorio API request failed with ${response.status}.`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    throw new Error(toNetworkErrorMessage(error));
  } finally {
    clearTimeout(timeout);
  }
}
