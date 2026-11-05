/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { User, Session, AuthError, AuthResponse, OAuthResponse } from "@supabase/supabase-js";
import { supabase, setSupabaseAccessToken } from "../lib/supabaseClient.ts";
import { decodeJwtPayload, isRecoveryJwt } from "../lib/jwt.ts";

const RECOVERY_STORAGE_KEY = "clipsync_password_recovery";
const RECOVERY_COMPLETED_KEY = "clipsync_recovery_completed";

function checkRecoveryState(accessToken: string, event?: string): boolean {
  try {
    if (event === "SIGNED_OUT") {
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
      localStorage.removeItem(RECOVERY_COMPLETED_KEY);
      return false;
    }
    if (event === "USER_UPDATED" || localStorage.getItem(RECOVERY_COMPLETED_KEY) === "true") {
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
      return false;
    }
    if (accessToken && !isRecoveryJwt(accessToken)) {
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
      return false;
    }
    if (event === "PASSWORD_RECOVERY") {
      localStorage.setItem(RECOVERY_STORAGE_KEY, "true");
      localStorage.removeItem(RECOVERY_COMPLETED_KEY);
      return true;
    }
    if (
      typeof window !== "undefined" &&
      (window.location.hash.includes("type=recovery") ||
        window.location.search.includes("type=recovery"))
    ) {
      localStorage.setItem(RECOVERY_STORAGE_KEY, "true");
      localStorage.removeItem(RECOVERY_COMPLETED_KEY);
      return true;
    }
    if (localStorage.getItem(RECOVERY_STORAGE_KEY) === "true" && localStorage.getItem(RECOVERY_COMPLETED_KEY) !== "true") {
      return true;
    }
    if (
      accessToken &&
      isRecoveryJwt(accessToken) &&
      localStorage.getItem(RECOVERY_COMPLETED_KEY) !== "true"
    ) {
      localStorage.setItem(RECOVERY_STORAGE_KEY, "true");
      return true;
    }
  } catch {
    // Ignore storage access errors
  }
  return false;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string;
  loading: boolean;
  isPasswordRecovery: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ data: OAuthResponse["data"]; error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
declare const chrome: any;

const syncExtensionToken = (accessToken: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const targetOrigin = typeof window !== "undefined" ? window.location.origin : "";

  if (accessToken) {
    localStorage.setItem("clipsync_access_token", accessToken);
    localStorage.setItem("clipsync_supabase_url", supabaseUrl);
    localStorage.setItem("clipsync_supabase_key", supabaseKey);
    if (typeof window !== "undefined" && targetOrigin) {
      window.postMessage(
        {
          type: "CLIPSYNC_AUTH_STATE",
          action: "LOGIN",
          accessToken,
          supabaseUrl,
          supabaseKey,
        },
        targetOrigin
      );
    }
  } else {
    localStorage.removeItem("clipsync_access_token");
    if (typeof window !== "undefined" && targetOrigin) {
      window.postMessage(
        {
          type: "CLIPSYNC_AUTH_STATE",
          action: "LOGOUT",
        },
        targetOrigin
      );
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    return checkRecoveryState("");
  });

  useEffect(() => {
    let isMounted = true;

    // Solo si estamos corriendo dentro del Popup de la extensión (chrome-extension://)
    const isExtensionPopup =
      typeof window !== "undefined" && window.location.protocol === "chrome-extension:";

    if (isExtensionPopup && typeof chrome !== "undefined" && chrome?.storage?.local) {
      const applyExtensionJwt = (jwt: string | undefined) => {
        if (!jwt) {
          setSupabaseAccessToken(null);
          setUser(null);
          setSession(null);
          return;
        }
        try {
          const claims = decodeJwtPayload(jwt);
          const derivedUser = claims?.sub
            ? ({ id: claims.sub, email: claims.email } as User)
            : null;
          if (!derivedUser) {
            setSupabaseAccessToken(null);
            setUser(null);
            setSession(null);
            chrome.storage.local.remove?.(["clipsync_access_token"]);
            return;
          }
          setSupabaseAccessToken(jwt);
          setUser(derivedUser);
          setSession({ access_token: jwt, user: derivedUser } as Session);
        } catch {
          setSupabaseAccessToken(null);
          setUser(null);
          setSession(null);
        }
      };

      chrome.storage.local.get(
        ["clipsync_access_token"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (res: any) => {
          if (!isMounted) return;
          applyExtensionJwt(res?.clipsync_access_token as string | undefined);
          setLoading(false);
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleStorageChange = (changes: any) => {
        if (!isMounted) return;
        if (changes.clipsync_access_token) {
          const newAccess = changes.clipsync_access_token.newValue as string | undefined;
          applyExtensionJwt(newAccess);
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        isMounted = false;
        if (typeof chrome !== "undefined" && chrome?.storage?.onChanged) {
          chrome.storage.onChanged.removeListener(handleStorageChange);
        }
      };
    }

    // Flujo normal de la Web App en el navegador
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        const activeToken = session?.access_token || "";
        const validClaims = activeToken ? decodeJwtPayload(activeToken) : null;
        const validSession = validClaims ? session : null;
        const validToken = validSession?.access_token || "";
        const recoveryActive = checkRecoveryState(validToken);
        setIsPasswordRecovery(recoveryActive);
        setSession(validSession);
        setUser(validSession?.user ?? null);
        syncExtensionToken(recoveryActive ? "" : validToken);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        const activeToken = session?.access_token || "";
        const validClaims = activeToken ? decodeJwtPayload(activeToken) : null;
        const validSession = validClaims ? session : null;
        const validToken = validSession?.access_token || "";
        const recoveryActive = checkRecoveryState(validToken, event);
        setIsPasswordRecovery(recoveryActive);
        setSession(validSession);
        setUser(validSession?.user ?? null);
        syncExtensionToken(recoveryActive ? "" : validToken);
        setLoading(false);
      }
    });

    const handleCrossTabRecovery = (e: StorageEvent) => {
      if (!isMounted) return;
      if (e.key === RECOVERY_STORAGE_KEY) {
        setIsPasswordRecovery(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleCrossTabRecovery);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleCrossTabRecovery);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
      localStorage.removeItem(RECOVERY_COMPLETED_KEY);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("clipsync_password_reset_success");
        }
      } catch {
      // Ignore storage errors
    }
    setIsPasswordRecovery(false);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.session?.user) {
      const activeToken = data.session.access_token || "";
      const validClaims = activeToken ? decodeJwtPayload(activeToken) : null;
      if (validClaims) {
        setUser(data.session.user);
        setSession(data.session);
        syncExtensionToken(activeToken);
      }
    }
    return { data, error };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    try {
      localStorage.setItem(RECOVERY_STORAGE_KEY, "true");
      localStorage.removeItem(RECOVERY_COMPLETED_KEY);
    } catch {
      // Ignore storage errors
    }
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      try {
        localStorage.removeItem(RECOVERY_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
      localStorage.setItem(RECOVERY_COMPLETED_KEY, "true");
      setIsPasswordRecovery(false);
    } catch {
      // Ignore storage errors
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      try {
        localStorage.setItem(RECOVERY_STORAGE_KEY, "true");
        localStorage.removeItem(RECOVERY_COMPLETED_KEY);
      } catch {
        // Ignore storage errors
      }
    } else {
      setIsPasswordRecovery(false);
      syncExtensionToken(session?.access_token || "");
    }
    return { error };
  }, [session?.access_token]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } finally {
      try {
        localStorage.removeItem(RECOVERY_STORAGE_KEY);
        localStorage.removeItem(RECOVERY_COMPLETED_KEY);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("clipsync_password_reset_success");
        }
      } catch {
        // Ignore storage errors
      }
      setUser(null);
      setSession(null);
      setIsPasswordRecovery(false);
      syncExtensionToken("");
    }
  }, []);

  // El único token de sesión expuesto en toda la aplicación es el JWT firmado (access_token)
  const token = session?.access_token || "";

  const value = useMemo(
    () => ({
      user,
      session,
      token,
      loading,
      isPasswordRecovery,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      resetPasswordForEmail,
      updatePassword,
      signOut,
    }),
    [
      user,
      session,
      token,
      loading,
      isPasswordRecovery,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      resetPasswordForEmail,
      updatePassword,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
