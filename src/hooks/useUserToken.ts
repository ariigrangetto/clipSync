import { useContext } from "react";
import { AuthContext, type AuthContextType } from "../context/authContext.tsx";

export function useUserToken(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      session: null,
      token: "",
      loading: false,
      signInWithEmail: async () => ({ data: { user: null, session: null }, error: null }),
      signUpWithEmail: async () => ({ data: { user: null, session: null }, error: null }),
      signInWithGoogle: async () => ({ data: { provider: "google" as const, url: null }, error: null }),
      signOut: async () => ({ error: null }),
    };
  }
  return context;
}
