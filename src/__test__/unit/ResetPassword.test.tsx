import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ResetPassword, {
  validatePasswordSecurity,
  calculatePasswordStrength,
} from "../../pages/ResetPassword.tsx";
import ProtectedRoute from "../../components/ProtectedRoute.tsx";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUpdatePassword = vi.fn().mockResolvedValue({ error: null });
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
let mockUser: { id: string; email: string } | null = {
  id: "user-uuid-1",
  email: "alice@example.com",
};
let mockIsPasswordRecovery = true;
let mockLoading = false;

vi.mock("../../hooks/useUserToken.ts", () => ({
  useUserToken: () => ({
    user: mockUser,
    session: mockUser ? { access_token: "jwt", user: mockUser } : null,
    token: mockUser ? "jwt" : "",
    loading: mockLoading,
    isPasswordRecovery: mockIsPasswordRecovery,
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updatePassword: mockUpdatePassword,
    signOut: mockSignOut,
  }),
}));

describe("ResetPassword Page & Security Validations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-uuid-1", email: "alice@example.com" };
    mockIsPasswordRecovery = true;
    mockLoading = false;
  });

  describe("Password Format & Security Validator (Unit)", () => {
    test("validates minimum length of 8 characters", () => {
      expect(validatePasswordSecurity("Short1A")).toBe(
        "Password must be at least 8 characters long"
      );
    });

    test("requires at least one uppercase letter", () => {
      expect(validatePasswordSecurity("lowercase123")).toBe(
        "Password must include at least one uppercase letter"
      );
    });

    test("requires at least one lowercase letter", () => {
      expect(validatePasswordSecurity("UPPERCASE123")).toBe(
        "Password must include at least one lowercase letter"
      );
    });

    test("allows password without numbers if strength is at least Good", () => {
      expect(validatePasswordSecurity("ValidLongPasswordWithoutNumbers")).toBeNull();
      expect(validatePasswordSecurity("PasswordWith!Symbol")).toBeNull();
    });

    test("requires password to reach at least Good strength", () => {
      expect(validatePasswordSecurity("Password")).toContain("Good");
    });

    test("returns null for a valid, compliant password with numbers", () => {
      expect(validatePasswordSecurity("ValidPassword123")).toBeNull();
    });
  });

  describe("Stageshow Password Strength Calculator", () => {
    test("computes strength score and labels accurately", () => {
      expect(calculatePasswordStrength("").label).toBe("Weak");
      expect(calculatePasswordStrength("abc").score).toBe(0);
      expect(calculatePasswordStrength("Valid123").score).toBeGreaterThanOrEqual(3);
      expect(calculatePasswordStrength("SuperSecureP@ssword2026").label).toBe("Strong");
    });
  });

  describe("ResetPassword UI Component", () => {
    test("renders ResetPassword form with initial UI elements and hides strength indicator when empty", () => {
      render(<ResetPassword />, { wrapper: TestWrapper });

      expect(
        screen.getByRole("heading", { level: 2, name: /Reset your password/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/^New password:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Confirm new password:/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Save new password/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("password-strength-container")
      ).not.toBeInTheDocument();
    });

    test("displays stageshow-styled password strength indicator when user enters a password", () => {
      render(<ResetPassword />, { wrapper: TestWrapper });

      const newPasswordInput = screen.getByLabelText(/^New password:/i);
      fireEvent.change(newPasswordInput, { target: { value: "Weak" } });

      expect(screen.getByTestId("password-strength-container")).toBeInTheDocument();
      expect(screen.getByTestId("password-strength-label")).toBeInTheDocument();
      expect(screen.getByTestId("strength-bar-1")).toBeInTheDocument();
      expect(screen.getByTestId("strength-bar-4")).toBeInTheDocument();
    });

    test("displays dynamic password match status when confirming password", () => {
      render(<ResetPassword />, { wrapper: TestWrapper });

      const newPasswordInput = screen.getByLabelText(/^New password:/i);
      const confirmInput = screen.getByLabelText(/^Confirm new password:/i);

      // Initially empty: no match status indicator
      expect(screen.queryByTestId("password-match-status")).not.toBeInTheDocument();

      // Typing a mismatch
      fireEvent.change(newPasswordInput, { target: { value: "SuperSecret123" } });
      fireEvent.change(confirmInput, { target: { value: "Mismatch123" } });

      const mismatchStatus = screen.getByTestId("password-match-status");
      expect(mismatchStatus).toBeInTheDocument();
      expect(mismatchStatus).toHaveTextContent(/Passwords do not match/i);

      // Typing a match
      fireEvent.change(confirmInput, { target: { value: "SuperSecret123" } });
      const matchStatus = screen.getByTestId("password-match-status");
      expect(matchStatus).toBeInTheDocument();
      expect(matchStatus).toHaveTextContent(/Passwords match/i);
    });

    test("shows inline error below form when password does not meet format requirements", async () => {
      render(<ResetPassword />, { wrapper: TestWrapper });

      const newPasswordInput = screen.getByLabelText(/^New password:/i);
      const confirmInput = screen.getByLabelText(/^Confirm new password:/i);
      const submitBtn = screen.getByRole("button", { name: /Save new password/i });

      // Too short
      fireEvent.change(newPasswordInput, { target: { value: "Ab1" } });
      fireEvent.change(confirmInput, { target: { value: "Ab1" } });
      fireEvent.click(submitBtn);

      expect(screen.getByTestId("reset-password-error")).toHaveTextContent(
        /Password must be at least 8 characters long/i
      );
      expect(mockUpdatePassword).not.toHaveBeenCalled();

      // Missing uppercase
      fireEvent.change(newPasswordInput, { target: { value: "onlylowercase1" } });
      fireEvent.change(confirmInput, { target: { value: "onlylowercase1" } });
      fireEvent.click(submitBtn);

      expect(screen.getByTestId("reset-password-error")).toHaveTextContent(
        /Password must include at least one uppercase letter/i
      );
      expect(mockUpdatePassword).not.toHaveBeenCalled();

      // Below Good strength (Fair)
      fireEvent.change(newPasswordInput, { target: { value: "FairPass" } });
      fireEvent.change(confirmInput, { target: { value: "FairPass" } });
      fireEvent.click(submitBtn);

      expect(screen.getByTestId("reset-password-error")).toHaveTextContent(
        /Password must reach at least 'Good' strength/i
      );
      expect(mockUpdatePassword).not.toHaveBeenCalled();

      // Mismatched passwords
      fireEvent.change(newPasswordInput, { target: { value: "ValidPassword1" } });
      fireEvent.change(confirmInput, { target: { value: "DifferentPassword2" } });
      fireEvent.click(submitBtn);

      expect(screen.getByTestId("reset-password-error")).toHaveTextContent(
        /Passwords do not match/i
      );
      expect(mockUpdatePassword).not.toHaveBeenCalled();

      // Mismatched passwords even when password lacks a number
      fireEvent.change(newPasswordInput, { target: { value: "NoNumberHere" } });
      fireEvent.change(confirmInput, { target: { value: "DifferentValue" } });
      fireEvent.click(submitBtn);

      expect(screen.getByTestId("reset-password-error")).toHaveTextContent(
        /Passwords do not match/i
      );
      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    test("shows inline error when updatePassword returns rate limit or server error", async () => {
      mockUpdatePassword.mockResolvedValueOnce({
        error: { message: "For security purposes, you can only request this once every 60 seconds", status: 429 },
      });

      render(<ResetPassword />, { wrapper: TestWrapper });

      const newPasswordInput = screen.getByLabelText(/^New password:/i);
      const confirmInput = screen.getByLabelText(/^Confirm new password:/i);
      const submitBtn = screen.getByRole("button", { name: /Save new password/i });

      fireEvent.change(newPasswordInput, { target: { value: "ValidPass123" } });
      fireEvent.change(confirmInput, { target: { value: "ValidPass123" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId("reset-password-error")).toHaveTextContent(
          /Too many attempts/i
        );
      });
    });

    test("submits valid password, shows inline success message and redirects to dashboard", async () => {
      render(<ResetPassword />, { wrapper: TestWrapper });

      const newPasswordInput = screen.getByLabelText(/^New password:/i);
      const confirmInput = screen.getByLabelText(/^Confirm new password:/i);
      const submitBtn = screen.getByRole("button", { name: /Save new password/i });

      fireEvent.change(newPasswordInput, { target: { value: "ValidPass123" } });
      fireEvent.change(confirmInput, { target: { value: "ValidPass123" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith("ValidPass123");
        expect(screen.getByTestId("reset-password-success")).toHaveTextContent(
          /Password updated successfully! Redirecting to dashboard.../i
        );
        expect(mockNavigate).toHaveBeenCalledWith("/", {
          replace: true,
          state: { passwordResetSuccess: true },
        });
      });
    });

    test("submits valid password without numbers when strength reaches Good", async () => {
      render(<ResetPassword />, { wrapper: TestWrapper });

      const newPasswordInput = screen.getByLabelText(/^New password:/i);
      const confirmInput = screen.getByLabelText(/^Confirm new password:/i);
      const submitBtn = screen.getByRole("button", { name: /Save new password/i });

      fireEvent.change(newPasswordInput, { target: { value: "ValidPasswordWithoutNumbers" } });
      fireEvent.change(confirmInput, { target: { value: "ValidPasswordWithoutNumbers" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith("ValidPasswordWithoutNumbers");
        expect(mockNavigate).toHaveBeenCalledWith("/", {
          replace: true,
          state: { passwordResetSuccess: true },
        });
      });
    });

    test("clicking cancel signs out and returns to login page", async () => {
      render(<ResetPassword />, { wrapper: TestWrapper });

      const cancelBtn = screen.getByRole("button", {
        name: /Cancel and return to login/i,
      });
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
      });
    });

    test("shows verifying session while loading is true and avoids premature redirect", () => {
      mockLoading = true;
      render(<ResetPassword />, { wrapper: TestWrapper });
      expect(screen.getByText(/Verifying session.../i)).toBeInTheDocument();
    });
  });

  describe("ProtectedRoute Recovery Guard", () => {
    test("ProtectedRoute blocks access to protected pages while isPasswordRecovery is true", () => {
      render(
        <ProtectedRoute>
          <div>Secret Dashboard Content</div>
        </ProtectedRoute>,
        { wrapper: TestWrapper }
      );

      expect(screen.queryByText(/Secret Dashboard Content/i)).not.toBeInTheDocument();
    });
  });
});
