import { Navigate } from "react-router-dom";
import { useUserToken } from "../hooks/useUserToken.ts";
import { FlowerIcon } from "./Icons.tsx";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUserToken();

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
          <span>Validating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
