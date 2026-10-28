/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { User, Session, AuthError, AuthResponse, OAuthResponse } from "@supabase/supabase-js";
import { supabase, setSupabaseAccessToken } from "../lib/supabaseClient.ts";
import { decodeJwtPayload } from "../lib/jwt.ts";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ data: OAuthResponse["data"]; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
declare const chrome: any;

const syncExtensionToken = (accessToken: string) => {
  setSupabaseAccessToken(accessToken || null);
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

  useEffect(() => {
    let isMounted = true;

    // Solo si estamos corriendo dentro del Popup de la extensión (chrome-extension://)
    const isExtensionPopup =
      typeof window !== "undefined" && window.location.protocol === "chrome-extension:";

    if (isExtensionPopup && typeof chrome !== "undefined" && chrome?.storage?.local) {
      chrome.storage.local.get(
        ["clipsync_access_token"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (res: any) => {
          if (!isMounted) return;
          if (res?.clipsync_access_token) {
            try {
              const jwt = res.clipsync_access_token as string;
              setSupabaseAccessToken(jwt);
              const claims = decodeJwtPayload(jwt);
              const derivedUser = claims?.sub
                ? ({ id: claims.sub, email: claims.email } as User)
                : null;
              setUser(derivedUser);
              setSession({ access_token: jwt, user: derivedUser } as Session);
            } catch {
              setSupabaseAccessToken(null);
              setUser(null);
              setSession(null);
            }
          } else {
            setSupabaseAccessToken(null);
          }
          setLoading(false);
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleStorageChange = (changes: any) => {
        if (!isMounted) return;
        if (changes.clipsync_access_token) {
          const newAccess = changes.clipsync_access_token.newValue as string | undefined;
          if (!newAccess) {
            setSupabaseAccessToken(null);
            setUser(null);
            setSession(null);
          } else {
            setSupabaseAccessToken(newAccess);
            const claims = decodeJwtPayload(newAccess);
            const derivedUser = claims?.sub
              ? ({ id: claims.sub, email: claims.email } as User)
              : null;
            setUser(derivedUser);
            setSession({ access_token: newAccess, user: derivedUser } as Session);
          }
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
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        syncExtensionToken(session?.access_token || "");
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        syncExtensionToken(session?.access_token || "");
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      syncExtensionToken("");
    }
    return { error };
  }, []);

  // El único token de sesión expuesto en toda la aplicación es el JWT firmado (access_token)
  const token = session?.access_token || "";

  const value = useMemo(
    () => ({
      user,
      session,
      token,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [user, session, token, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut]
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
