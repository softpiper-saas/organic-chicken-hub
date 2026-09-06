export function normalizeProductUrl(rawUrl: string, baseUrl?: string) {
  const trimmed = rawUrl.trim();

  try {
    const url = new URL(trimmed, baseUrl);
    url.hash = "";
    url.search = "";

    const serialized = url.toString();
    return serialized.endsWith("/") ? serialized.slice(0, -1) : serialized;
  } catch {
    return trimmed.replace(/[?#].*$/, "").replace(/\/$/, "");
  }
}
