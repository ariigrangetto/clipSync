/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Check, X } from "lucide-react";
import { useUserToken } from "../hooks/useUserToken.ts";
import { FlowerIcon } from "../components/Icons.tsx";

const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordSecurity(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter";
  }
  const strength = calculatePasswordStrength(password);
  if (strength.score < 3) {
    return "Password must reach at least 'Good' strength (add numbers, symbols, or make it at least 12 characters)";
  }
  return null;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: "Weak" | "Fair" | "Good" | "Strong";
  color: string;
  bgColor: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Weak", color: "#6E6B65", bgColor: "#262B28" };
  }
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password) || password.length >= 12) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: "Weak", color: "#F87171", bgColor: "#EF4444" };
    case 2:
      return { score: 2, label: "Fair", color: "#FBBF24", bgColor: "#EAB308" };
    case 3:
      return { score: 3, label: "Good", color: "#7EC691", bgColor: "#5E9E6E" };
    case 4:
      return { score: 4, label: "Strong", color: "#7EC691", bgColor: "#4EAC6D" };
    default:
      return { score: 0, label: "Weak", color: "#F87171", bgColor: "#EF4444" };
  }
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, loading, isPasswordRecovery, updatePassword, signOut } = useUserToken();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  useEffect(() => {
    if (loading) return;
    // Check if recovery is indicated in localStorage or URL
    const hasRecoveryIntent =
      typeof window !== "undefined" &&
      (window.location.hash.includes("access_token") ||
        window.location.hash.includes("type=recovery") ||
        window.location.search.includes("type=recovery") ||
        window.location.search.includes("code=") ||
        localStorage.getItem("clipsync_password_recovery") === "true");

    if (!user && !isPasswordRecovery && !hasRecoveryIntent) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, isPasswordRecovery, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 select-none"
        style={{ background: "#121413", color: "#EDEDEA", fontFamily: "var(--font-body)" }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 animate-bounce"
          style={{ background: "#1D3323" }}
        >
          <FlowerIcon size={26} style={{ color: "#7EC691" }} />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#7EC691" }}>
          <div className="w-3.5 h-3.5 border-2 border-[#7EC691] border-t-transparent rounded-full animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    const securityError = validatePasswordSecurity(password);
    if (securityError) {
      setErrorMessage(securityError);
      return;
    }

    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);

    if (error) {
      const msg = (error.message || "").toLowerCase();
      const isRateLimit =
        error.status === 429 ||
        msg.includes("rate limit") ||
        msg.includes("too many requests") ||
        msg.includes("security purposes") ||
        msg.includes("once every");
      const friendlyError = isRateLimit
        ? "Too many attempts. For security reasons, please wait a moment before trying again."
        : error.message || "Failed to update password";
      setErrorMessage(friendlyError);
    } else {
      setSuccessMessage("Password updated successfully! Redirecting to dashboard...");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("clipsync_password_reset_success", "true");
        if (window.location.hash || window.location.search) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
      navigate("/", { replace: true, state: { passwordResetSuccess: true } });
    }
  };

  const handleCancel = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-3 sm:p-6 md:p-8 font-sans select-none"
      style={{ background: "#121413", color: "#EDEDEA" }}
    >
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-3 sm:py-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-sm logo-flower shrink-0"
            style={{ background: "#5E9E6E" }}
          >
            <FlowerIcon size={20} style={{ color: "#FFFFFF" }} />
          </div>
          <div>
            <h1
              className="text-xl sm:text-2xl leading-none font-medium"
              style={{ fontFamily: "var(--font-display)", color: "#EDEDEA" }}
            >
              ClipSync
            </h1>
            <span className="text-xs text-petal-muted">
              Secure Password Reset
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-4 sm:py-8">
        <div
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 border shadow-sm space-y-5 sm:space-y-6 animate-fadeSlideUp"
          style={{ background: "#181B19", borderColor: "#2C322E" }}
        >
          <div className="text-center space-y-2">
            <div
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "#1D3323" }}
            >
              <FlowerIcon size={26} style={{ color: "#7EC691" }} />
            </div>
            <h2
              className="text-xl sm:text-2xl font-serif leading-tight pt-2"
              style={{ fontFamily: "var(--font-display)", color: "#EDEDEA" }}
            >
              Reset your password
            </h2>
            <p className="text-xs text-petal-muted leading-relaxed max-w-xs mx-auto">
              Please enter and confirm your new password. It must be at least 8 characters and contain uppercase, lowercase, and numeric characters.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium text-[#9E9B93] mb-1.5"
                htmlFor="new-password"
              >
                New password:
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-petal-muted" />
                <input
                  type="password"
                  id="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-petal-green transition-colors placeholder-[#6E6B65]"
                  style={{
                    background: "#141615",
                    borderColor: "#2C322E",
                    color: "#EDEDEA",
                  }}
                />
              </div>

              {/* Stageshow-styled Password Strength Indicator */}
              {password && (
                <div className="space-y-1.5 pt-2 animate-fadeSlideUp" data-testid="password-strength-container">
                  <div className="flex items-center justify-between text-[0.68rem] font-medium">
                    <span className="text-[#9E9B93]">Password strength:</span>
                    <span style={{ color: strength.color }} data-testid="password-strength-label">
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        data-testid={`strength-bar-${step}`}
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          background: step <= strength.score ? strength.bgColor : "#262B28",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-medium text-[#9E9B93] mb-1.5"
                htmlFor="confirm-password"
              >
                Confirm new password:
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-petal-muted" />
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-petal-green transition-colors placeholder-[#6E6B65]"
                  style={{
                    background: "#141615",
                    borderColor:
                      confirmPassword.length > 0
                        ? password === confirmPassword
                          ? "#4EAC6D"
                          : "#F87171"
                        : "#2C322E",
                    color: "#EDEDEA",
                  }}
                />
              </div>
              {confirmPassword.length > 0 && (
                <div
                  data-testid="password-match-status"
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-medium transition-all duration-200"
                  style={{
                    color: password === confirmPassword ? "#7EC691" : "#F87171",
                  }}
                >
                  {password === confirmPassword ? (
                    <>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !password || !confirmPassword}
              className="w-full py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              style={{ background: "#5E9E6E" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#72B583")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#5E9E6E")}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span>Save new password</span>
              )}
            </button>

            {/* Inline Feedback directly beneath the form, NO bottom toast */}
            {successMessage && (
              <div
                className="p-3 rounded-xl border text-center animate-fadeSlideUp"
                data-testid="reset-password-success"
                style={{
                  background: "#1D3323",
                  borderColor: "#2C322E",
                }}
              >
                <p className="text-xs font-medium text-[#7EC691]">
                  {successMessage}
                </p>
              </div>
            )}

            {errorMessage && (
              <div
                className="p-3 rounded-xl border text-center animate-fadeSlideUp"
                data-testid="reset-password-error"
                style={{
                  background: "#331D1D",
                  borderColor: "#4A2424",
                }}
              >
                <p className="text-xs font-medium text-[#F87171]">
                  {errorMessage}
                </p>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-petal-muted hover:text-[#EDEDEA] transition-colors cursor-pointer"
              >
                Cancel and return to login
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="text-center text-xs text-petal-muted py-4">
        ClipSync &copy; {new Date().getFullYear()} — Secure Supabase Authentication
      </footer>
    </div>
  );
}
