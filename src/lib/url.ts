/**
 * URL validation and sanitization helpers to prevent XSS (javascript:/data: schemes),
 * UI render crashes on malformed URLs, and SSRF / token exfiltration to untrusted hosts.
 */

export function isSafeHttpUrl(value?: string | null): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  try {
    const parsed = new URL(value.trim());
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function getSafeHostname(
  value?: string | null,
  fallback = "Manual entry"
): string {
  if (!value || typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const trimmed = value.trim();
  if (isSafeHttpUrl(trimmed)) {
    try {
      return new URL(trimmed).hostname;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

export function isValidSupabaseUrl(value?: string | null): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  try {
    const parsed = new URL(value.trim());
    const host = parsed.hostname.toLowerCase();
    return (
      parsed.protocol === "https:" &&
      Boolean(host) &&
      (host.endsWith(".supabase.co") || host.endsWith(".supabase.in"))
    );
  } catch {
    return false;
  }
}
