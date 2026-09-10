/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { User, Session, AuthError, AuthResponse, OAuthResponse } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.ts";

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

const syncExtensionToken = (token: string, userObj?: User | null) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  if (token) {
    localStorage.setItem("clipsync_user_token", token);
    localStorage.setItem("clipsync_supabase_url", supabaseUrl);
    localStorage.setItem("clipsync_supabase_key", supabaseKey);
    if (userObj) {
      localStorage.setItem("clipsync_user_data", JSON.stringify(userObj));
    }
    // Notificar a content.js en tiempo real sin requerir APIs de Chrome en la app
    if (typeof window !== "undefined") {
      window.postMessage(
        {
          type: "CLIPSYNC_AUTH_STATE",
          action: "LOGIN",
          token,
          supabaseUrl,
          supabaseKey,
          user: userObj,
        },
        "*"
      );
    }
  } else {
    localStorage.removeItem("clipsync_user_token");
    localStorage.removeItem("clipsync_user_data");
    // Notificar logout a content.js en tiempo real
    if (typeof window !== "undefined") {
      window.postMessage(
        {
          type: "CLIPSYNC_AUTH_STATE",
          action: "LOGOUT",
        },
        "*"
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
        ["clipsync_user_token", "clipsync_user_data"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (res: any) => {
          if (!isMounted) return;
          if (res?.clipsync_user_token) {
            try {
              const parsedUser = res.clipsync_user_data
                ? JSON.parse(res.clipsync_user_data)
                : null;
              setUser(parsedUser);
            } catch {
              setUser(null);
            }
          }
          setLoading(false);
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleStorageChange = (changes: any) => {
        if (!isMounted) return;
        if (changes.clipsync_user_token) {
          if (!changes.clipsync_user_token.newValue) {
            setUser(null);
          }
        }
        if (changes.clipsync_user_data?.newValue) {
          try {
            setUser(JSON.parse(changes.clipsync_user_data.newValue));
          } catch {
            setUser(null);
          }
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        isMounted = false;
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }

    // Flujo normal de la Web App en el navegador
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        const currentToken = currentUser?.id || currentUser?.email || "";
        syncExtensionToken(currentToken, currentUser);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        const currentToken = currentUser?.id || currentUser?.email || "";
        syncExtensionToken(currentToken, currentUser);
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

  const token = user?.id || user?.email || "";

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
