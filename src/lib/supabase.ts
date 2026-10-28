import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const PUBKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

let currentAccessToken: string | null = null;

export const supabase = createClient(URL, PUBKEY, {
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

export function setSupabaseAccessToken(token: string | null): void {
  currentAccessToken = token && token.trim() ? token : null;
  supabase.realtime?.setAuth?.(currentAccessToken);
}

export function getSupabaseAccessToken(): string | null {
  return currentAccessToken;
}
