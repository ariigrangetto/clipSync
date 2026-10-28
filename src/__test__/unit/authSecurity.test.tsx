import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";

const { mockGetSession, mockOnAuthStateChange, mockSignOut, mockSetSupabaseAccessToken } =
  vi.hoisted(() => ({
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
    mockSignOut: vi.fn(),
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
      signOut: mockSignOut,
    },
  },
}));

import { AuthProvider, useAuth } from "../../context/authContext.tsx";
import { getUserIdFromJwt } from "../../lib/jwt.ts";

function TokenConsumer({
  onToken,
  onUser,
}: {
  onToken: (token: string) => void;
  onUser?: (userId: string | null) => void;
}) {
  const { token, user } = useAuth();
  onToken(token);
  onUser?.(user?.id ?? null);
  return <div>Token: {token}</div>;
}

describe("JWT-Only Authentication Architecture (S1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("getUserIdFromJwt extracts sub claim from valid JWT payload", () => {
    // Header: {"alg":"HS256","typ":"JWT"}, Payload: {"sub":"user-uuid-99","email":"test@clipsync.dev"}
    const sampleJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtOTkiLCJlbWFpbCI6InRlc3RAY2xpcHN5bmMuZGV2In0.sig";

    expect(getUserIdFromJwt(sampleJwt)).toBe("user-uuid-99");
    expect(getUserIdFromJwt("")).toBe("");
    expect(getUserIdFromJwt("invalid-token")).toBe("");
  });

  test("AuthContext exposes ONLY the signed JWT as token and never stores plain-text clipsync_user_token", async () => {
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
    render(
      <AuthProvider>
        <TokenConsumer onToken={(t) => (exposedToken = t)} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(exposedToken).toBe(sampleJwt);
    });

    expect(localStorage.getItem("clipsync_access_token")).toBe(sampleJwt);
    expect(localStorage.getItem("clipsync_user_token")).toBeNull();
    expect(localStorage.getItem("clipsync_user_data")).toBeNull();
    expect(mockSetSupabaseAccessToken).toHaveBeenCalledWith(sampleJwt);

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
});
