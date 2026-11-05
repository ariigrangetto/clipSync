import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignOut,
  mockResetPasswordForEmail,
  mockUpdateUser,
  mockSetSupabaseAccessToken,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignOut: vi.fn(),
  mockResetPasswordForEmail: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockSetSupabaseAccessToken: vi.fn(),
}));

vi.mock("../../lib/supabaseClient.ts", () => ({
  setSupabaseAccessToken: mockSetSupabaseAccessToken,
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  },
}));

import { AuthProvider, useAuth } from "../../context/authContext.tsx";
import { getUserIdFromJwt, isJwtExpired } from "../../lib/jwt.ts";

function TokenConsumer({
  onToken,
  onUser,
  onAuth,
}: {
  onToken: (token: string) => void;
  onUser?: (userId: string | null) => void;
  onAuth?: (auth: ReturnType<typeof useAuth>) => void;
}) {
  const auth = useAuth();
  onToken(auth.token);
  onUser?.(auth.user?.id ?? null);
  onAuth?.(auth);
  return <div>Token: {auth.token}</div>;
}

describe("JWT-Only Authentication Architecture (S1, S2, S3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("getUserIdFromJwt extracts sub claim from valid JWT and rejects expired JWTs (S3)", () => {
    // Header: {"alg":"HS256","typ":"JWT"}, Payload: {"sub":"user-uuid-99","email":"test@clipsync.dev"}
    const sampleJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtOTkiLCJlbWFpbCI6InRlc3RAY2xpcHN5bmMuZGV2In0.sig";

    // Expired payload: {"sub":"user-uuid-expired","exp":1000000000}
    const expiredJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtZXhwaXJlZCIsImV4cCI6MTAwMDAwMDAwMH0.sig";

    expect(getUserIdFromJwt(sampleJwt)).toBe("user-uuid-99");
    expect(isJwtExpired(sampleJwt)).toBe(false);
    expect(isJwtExpired(expiredJwt)).toBe(true);
    expect(getUserIdFromJwt(expiredJwt)).toBe("");
    expect(getUserIdFromJwt("")).toBe("");
    expect(getUserIdFromJwt("invalid-token")).toBe("");
  });

  test("Web App mode exposes signed JWT, bridges to extension, and does NOT call setSupabaseAccessToken (S2)", async () => {
    const postMessageSpy = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    const sampleJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtMSIsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20ifQ.sig";

    const fakeUser = { id: "user-uuid-1", email: "alice@example.com" };
    const fakeSession = {
      access_token: sampleJwt,
      user: fakeUser,
    };

    mockGetSession.mockResolvedValue({
      data: { session: fakeSession },
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    let exposedToken = "";
    let latestAuth: ReturnType<typeof useAuth> | null = null;
    render(
      <AuthProvider>
        <TokenConsumer
          onToken={(t) => (exposedToken = t)}
          onAuth={(a) => (latestAuth = a)}
        />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(exposedToken).toBe(sampleJwt);
    });

    expect(localStorage.getItem("clipsync_access_token")).toBe(sampleJwt);
    expect(localStorage.getItem("clipsync_user_token")).toBeNull();
    expect(localStorage.getItem("clipsync_user_data")).toBeNull();
    // In Web App mode, Supabase Auth manages headers & Realtime natively (Option A)
    expect(mockSetSupabaseAccessToken).not.toHaveBeenCalled();

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "CLIPSYNC_AUTH_STATE",
        action: "LOGIN",
        accessToken: sampleJwt,
      }),
      window.location.origin
    );

    const postedPayload = postMessageSpy.mock.calls[0]?.[0];
    expect(postedPayload).not.toHaveProperty("token");
    expect(postedPayload).not.toHaveProperty("user");

    // Verify signOut cleans up local state even if supabase.auth.signOut returns a network error (S3)
    mockSignOut.mockResolvedValueOnce({ error: { message: "Network failure" } });
    await act(async () => {
      await latestAuth?.signOut();
    });

    expect(exposedToken).toBe("");
    expect(localStorage.getItem("clipsync_access_token")).toBeNull();

    postMessageSpy.mockRestore();
  });

  test("Extension Popup mode authenticates shared supabase client via setSupabaseAccessToken and updates user on account switch", async () => {
    const originalLocation = window.location;
    // Header: {"alg":"HS256","typ":"JWT"}, Payload: {"sub":"user-uuid-1","email":"alice@example.com"}
    const jwtUser1 =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtMSIsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20ifQ.sig";
    // Header: {"alg":"HS256","typ":"JWT"}, Payload: {"sub":"user-uuid-99","email":"test@clipsync.dev"}
    const jwtUser2 =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtOTkiLCJlbWFpbCI6InRlc3RAY2xpcHN5bmMuZGV2In0.sig";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let storageChangeListener: ((changes: any) => void) | null = null;

    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, protocol: "chrome-extension:", origin: "chrome-extension://id" },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = {
      storage: {
        local: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          get: vi.fn((_keys: string[], cb: (res: any) => void) => {
            cb({ clipsync_access_token: jwtUser1 });
          }),
        },
        onChanged: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addListener: vi.fn((fn: (changes: any) => void) => {
            storageChangeListener = fn;
          }),
          removeListener: vi.fn(),
        },
      },
    };

    let exposedToken = "";
    let exposedUserId: string | null = null;

    const { unmount } = render(
      <AuthProvider>
        <TokenConsumer
          onToken={(t) => (exposedToken = t)}
          onUser={(uid) => (exposedUserId = uid)}
        />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(exposedToken).toBe(jwtUser1);
      expect(exposedUserId).toBe("user-uuid-1");
    });

    expect(mockSetSupabaseAccessToken).toHaveBeenCalledWith(jwtUser1);

    // Switch account in chrome.storage.onChanged
    act(() => {
      storageChangeListener?.({
        clipsync_access_token: { newValue: jwtUser2 },
      });
    });

    await waitFor(() => {
      expect(exposedToken).toBe(jwtUser2);
      expect(exposedUserId).toBe("user-uuid-99");
    });
    expect(mockSetSupabaseAccessToken).toHaveBeenCalledWith(jwtUser2);

    // Expired token in chrome.storage.onChanged should be rejected (S3)
    const expiredJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtZXhwaXJlZCIsImV4cCI6MTAwMDAwMDAwMH0.sig";
    act(() => {
      storageChangeListener?.({
        clipsync_access_token: { newValue: expiredJwt },
      });
    });

    await waitFor(() => {
      expect(exposedToken).toBe("");
      expect(exposedUserId).toBeNull();
    });
    expect(mockSetSupabaseAccessToken).toHaveBeenLastCalledWith(null);

    // Logout in chrome.storage.onChanged
    act(() => {
      storageChangeListener?.({
        clipsync_access_token: { newValue: undefined },
      });
    });

    await waitFor(() => {
      expect(exposedToken).toBe("");
      expect(exposedUserId).toBeNull();
    });
    expect(mockSetSupabaseAccessToken).toHaveBeenCalledWith(null);

    unmount();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).chrome;
  });

  test("Password recovery flow locks session in recovery state and redirects email link to /reset-password until password is updated (S4)", async () => {
    // Payload: {"sub":"user-uuid-1","email":"alice@example.com","amr":[{"method":"recovery","timestamp":1700000000}]}
    const recoveryJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtMSIsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJhbXIiOlt7Im1ldGhvZCI6InJlY292ZXJ5IiwidGltZXN0YW1wIjoxNzAwMDAwMDAwfV19.sig";
    const recoverySession = {
      access_token: recoveryJwt,
      user: { id: "user-uuid-1", email: "alice@example.com" },
    };

    mockGetSession.mockResolvedValue({ data: { session: recoverySession } });
    mockOnAuthStateChange.mockImplementation((cb) => {
      cb("INITIAL_SESSION", recoverySession);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });

    let latestAuth: ReturnType<typeof useAuth> | null = null;
    render(
      <AuthProvider>
        <TokenConsumer onToken={() => {}} onAuth={(a) => (latestAuth = a)} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect((latestAuth as ReturnType<typeof useAuth> | null)?.isPasswordRecovery).toBe(true);
    });

    // While in password recovery, access token must NOT be synced to the extension
    expect(localStorage.getItem("clipsync_access_token")).toBeNull();

    await act(async () => {
      await (latestAuth as ReturnType<typeof useAuth> | null)?.resetPasswordForEmail("alice@example.com");
    });

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("alice@example.com", {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    await act(async () => {
      await (latestAuth as ReturnType<typeof useAuth> | null)?.updatePassword("NewStrongPass123");
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "NewStrongPass123" });
    expect((latestAuth as ReturnType<typeof useAuth> | null)?.isPasswordRecovery).toBe(false);
        expect(localStorage.getItem("clipsync_access_token")).toBe(recoveryJwt);
  });

  test("clears recovery lock on USER_UPDATED event even when pathname starts with /reset-password", async () => {
    localStorage.setItem("clipsync_password_recovery", "true");
    localStorage.removeItem("clipsync_recovery_completed");

    mockGetSession.mockResolvedValue({ data: { session: null } });
    let authStateCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      authStateCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    let latestAuth: ReturnType<typeof useAuth> | null = null;
    render(
      <AuthProvider>
        <TokenConsumer onToken={() => {}} onAuth={(a) => (latestAuth = a)} />
      </AuthProvider>
    );

    const sampleJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtOTkiLCJlbWFpbCI6InRlc3RAY2xpcHN5bmMuZGV2In0.sig";

    // Simulate USER_UPDATED fired by Supabase Auth after successful updatePassword
    await act(async () => {
      authStateCallback?.("USER_UPDATED", {
        access_token: sampleJwt,
        user: { id: "user-uuid-99", email: "test@clipsync.dev" },
      });
    });

    expect(localStorage.getItem("clipsync_password_recovery")).toBeNull();
    expect((latestAuth as ReturnType<typeof useAuth> | null)?.isPasswordRecovery).toBe(false);
  });
});
