import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Smartphone, Puzzle, Mail, Lock } from "lucide-react";
import { useUserToken } from "../hooks/useUserToken.ts";
import { FlowerIcon } from "../components/Icons.tsx";
import useNotification from "../hooks/useNotification.tsx";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useUserToken();
  const { showNotification } = useNotification();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

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

  const handleEmailAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      showNotification("Please, fill in the email and password", true);
      return;
    }

    setSubmitting(true);
    if (isSignUp) {
      const { data, error } = await signUpWithEmail(trimmedEmail, password);
      setSubmitting(false);
      if (error) {
        showNotification(error.message || "Error while registering", true);
      } else if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        showNotification("Email already in use", true);
      } else {
        showNotification("Account created successfully. Please check your email.", false);
      }
    } else {
      const { error } = await signInWithEmail(trimmedEmail, password);
      setSubmitting(false);
      if (error) {
        const errorMessage =
          error.message === "Invalid login credentials"
            ? "User does not exist or invalid credentials"
            : error.message || "User does not exist or invalid credentials";
        showNotification(errorMessage, true);
      } else {
        showNotification("Logged in successfully", false);
        navigate("/");
      }
    }
  };

  const handleGoogleAuth = async () => {
    setSubmitting(true);
    const { error } = await signInWithGoogle();
    setSubmitting(false);
    if (error) {
      showNotification(error.message || "Error while signing in with Google", true);
    }
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
            <span className="text-xs text-petal-muted hidden xs:block">
              Capture and sync seamlessly with Supabase Auth
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
              {isSignUp ? "Create an account in ClipSync" : "Your note space"}
            </h2>
            <p className="text-xs text-petal-muted leading-relaxed max-w-xs mx-auto">
              Save your selections and sync your devices securely with Email or Google.
            </p>
          </div>


          <div className="space-y-3 pt-2">
            <button
              onClick={handleGoogleAuth}
              disabled={submitting}
              type="button"
              className="w-full py-3 px-4 rounded-xl text-sm font-medium text-[#EDEDEA] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 border disabled:opacity-50 cursor-pointer"
              style={{ background: "#1E2220", borderColor: "#2C322E" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#262B28")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1E2220")}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-petal-border" />
            <span className="text-xs text-petal-muted uppercase font-medium tracking-wider">
              or sign up with email
            </span>
            <div className="flex-1 h-px bg-petal-border" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#9E9B93] mb-1.5" htmlFor="email">
                Email address:
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-petal-muted" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-petal-green transition-colors placeholder-[#6E6B65]"
                  style={{
                    background: "#141615",
                    borderColor: "#2C322E",
                    color: "#EDEDEA",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9B93] mb-1.5" htmlFor="password">
                Password:
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-petal-muted" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-petal-green transition-colors placeholder-[#6E6B65]"
                  style={{
                    background: "#141615",
                    borderColor: "#2C322E",
                    color: "#EDEDEA",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="w-full py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              style={{ background: "#5E9E6E" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#72B583")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#5E9E6E")}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isSignUp ? "Signing up..." : "Verifying..."}</span>
                </span>
              ) : (
                <span>{isSignUp ? "Sign Up" : "Log In"}</span>
              )}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setIsSignUp((prev) => !prev)}
              className="text-xs font-medium text-[#7EC691] hover:underline cursor-pointer"
            >
              {isSignUp
                ? "Already have an account? Sign in here"
                : "Don't have an account? Sign up here"}
            </button>
          </div>

          <div
            className="pt-4 border-t grid grid-cols-3 gap-1.5 sm:gap-2 text-center"
            style={{ borderColor: "#2C322E" }}
          >
            <div className="flex flex-col items-center space-y-1">
              <Zap size={18} className="text-petal-green" />
              <p className="text-[0.62rem] sm:text-[0.68rem] text-petal-muted leading-tight">Supabase Security</p>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Smartphone size={18} className="text-petal-green" />
              <p className="text-[0.62rem] sm:text-[0.68rem] text-petal-muted leading-tight">Multi-device</p>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Puzzle size={18} className="text-petal-green" />
              <p className="text-[0.62rem] sm:text-[0.68rem] text-petal-muted leading-tight">Web Extension</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-petal-muted py-4">
        ClipSync &copy; {new Date().getFullYear()} — Secure Supabase Authentication
      </footer>
    </div>
  );
}