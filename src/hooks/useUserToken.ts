import { useState, useCallback } from "react";

const STORAGE_KEY = "clipsync_user_token";

export function generateToken(): string {
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `clip_${randomHex}`;
}

export function useUserToken() {
  const [token, setTokenState] = useState<string>(() => {
    // 1. Check existing saved token in localStorage
    const savedToken = localStorage.getItem(STORAGE_KEY);
    if (savedToken) {
      return savedToken;
    }

    // 2. Generate new secure token if none exists
    const newToken = generateToken();
    localStorage.setItem(STORAGE_KEY, newToken);
    return newToken;
  });

  const changeToken = useCallback((newToken: string) => {
    const trimmed = newToken.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setTokenState(trimmed);
  }, []);

  const getSyncLink = useCallback(() => {
    const url = new URL(window.location.origin + "/login");
    url.searchParams.set("token", token);
    return url.toString();
  }, [token]);

  return {
    token,
    changeToken,
    getSyncLink,
  };
}
