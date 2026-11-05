import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const PUBKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";
export const RECOVERY_STORAGE_KEY = "clipsync_password_recovery";
export const RECOVERY_COMPLETED_KEY = "clipsync_recovery_completed";

// Capture recovery URL parameters at module load time BEFORE `createClient`
// parses and clears `window.location.hash` / `window.location.search`.
if (
  typeof window !== "undefined" &&
  (window.location.hash.includes("type=recovery") ||
    window.location.search.includes("type=recovery"))
) {
  try {
    localStorage.setItem(RECOVERY_STORAGE_KEY, "true");
    localStorage.removeItem(RECOVERY_COMPLETED_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Extension-popup-only JWT override (`chrome-extension://`).
 * In the standard Web App, `currentAccessToken` remains `null` and `@supabase/supabase-js`
 * manages HTTP `Authorization` headers and `realtime.setAuth` natively via `supabase.auth`.
 */
let currentAccessToken: string | null = null;

export const supabase = createClient(URL, PUBKEY, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      if (currentAccessToken) {
        const headers = new Headers(init?.headers);
        headers.set("Authorization", `Bearer ${currentAccessToken}`);
        return fetch(input, { ...init, headers });
      }
      return fetch(input, init);
    },
  },
});

// Subscribe synchronously at client creation so a `PASSWORD_RECOVERY` event emitted
// during `GoTrueClient.initialize()` before React mounts `AuthProvider` is never missed.
supabase.auth?.onAuthStateChange?.((event) => {
  try {
    if (event === "PASSWORD_RECOVERY") {
      localStorage.setItem(RECOVERY_STORAGE_KEY, "true");
      localStorage.removeItem(RECOVERY_COMPLETED_KEY);
    } else if (event === "USER_UPDATED") {
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
      localStorage.setItem(RECOVERY_COMPLETED_KEY, "true");
    } else if (event === "SIGNED_OUT") {
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
      localStorage.removeItem(RECOVERY_COMPLETED_KEY);
    }
  } catch {
    // Ignore storage errors
  }
});

/**
 * Injects the bridged JWT into the shared Supabase client exclusively when running inside
 * the Chrome Extension Popup (`chrome-extension://`), where no `refresh_token` is stored.
 */
export function setSupabaseAccessToken(token: string | null): void {
  currentAccessToken = token && token.trim() ? token : null;
  supabase.realtime?.setAuth?.(currentAccessToken);
}

export function getSupabaseAccessToken(): string | null {
  return currentAccessToken;
}
