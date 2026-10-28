import { describe, expect, test } from "vitest";
import { isSafeHttpUrl, getSafeHostname, isValidSupabaseUrl } from "../../lib/url.ts";

describe("URL & Input Security Helpers (S1 & S2)", () => {
  test("isSafeHttpUrl allows only valid http and https URLs and blocks XSS protocols", () => {
    expect(isSafeHttpUrl("https://clipsyncc-ashen.vercel.app/notes")).toBe(true);
    expect(isSafeHttpUrl("http://example.com/article")).toBe(true);

    // Block XSS / dangerous protocols
    expect(isSafeHttpUrl("javascript:alert(document.cookie)")).toBe(false);
    expect(isSafeHttpUrl("JAVASCRIPT:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeHttpUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeHttpUrl("file:///etc/passwd")).toBe(false);

    // Block malformed or plain-text sources
    expect(isSafeHttpUrl("http://")).toBe(false);
    expect(isSafeHttpUrl("http class notes")).toBe(false);
    expect(isSafeHttpUrl("Manual entry")).toBe(false);
    expect(isSafeHttpUrl("")).toBe(false);
    expect(isSafeHttpUrl(null)).toBe(false);
  });

  test("getSafeHostname extracts hostname safely and never throws on malformed 'http' strings", () => {
    expect(getSafeHostname("https://developer.mozilla.org/en-US/docs")).toBe(
      "developer.mozilla.org"
    );
    expect(getSafeHostname("http://localhost:5173/dashboard")).toBe("localhost");

    // Malformed strings starting with 'http' must not throw Invalid URL
    expect(() => getSafeHostname("http://")).not.toThrow();
    expect(getSafeHostname("http://")).toBe("http://");
    expect(getSafeHostname("http class notes")).toBe("http class notes");

    // Dangerous schemes return plain string without being treated as valid host
    expect(getSafeHostname("javascript:alert(1)")).toBe("javascript:alert(1)");

    // Empty / null fallback
    expect(getSafeHostname("", "Manual entry")).toBe("Manual entry");
    expect(getSafeHostname(undefined, "Manual entry")).toBe("Manual entry");
  });

  test("isValidSupabaseUrl allows only HTTPS Supabase project endpoints and blocks SSRF/exfiltration hosts", () => {
    expect(isValidSupabaseUrl("https://abcdefghijklm.supabase.co")).toBe(true);
    expect(isValidSupabaseUrl("https://abcdefghijklm.supabase.in")).toBe(true);

    // Reject insecure HTTP or non-Supabase hosts / internal IPs
    expect(isValidSupabaseUrl("http://abcdefghijklm.supabase.co")).toBe(false);
    expect(isValidSupabaseUrl("http://127.0.0.1:8000")).toBe(false);
    expect(isValidSupabaseUrl("http://localhost:54321")).toBe(false);
    expect(isValidSupabaseUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isValidSupabaseUrl("https://evil-attacker.com")).toBe(false);
    expect(isValidSupabaseUrl("https://supabase.co.evil.com")).toBe(false);
    expect(isValidSupabaseUrl("")).toBe(false);
  });
});
