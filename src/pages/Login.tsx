import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Zap, Smartphone, Puzzle } from "lucide-react";
import { useUserToken, generateToken } from "../hooks/useUserToken.ts";
import { FlowerIcon, PlusIcon } from "../components/Icons.tsx";
import useNotification from "../hooks/useNotification.tsx";

export default function Login() {
  const navigate = useNavigate();
  const { changeToken } = useUserToken();
  const { showNotification } = useNotification();
  const [inputToken, setInputToken] = useState("");

  // Manejar sincronización si vienen parámetros en la URL de Login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      changeToken(tokenParam);
      showNotification("Espacio sincronizado correctamente", false);
      navigate("/", { replace: true });
    }
  }, [changeToken, navigate, showNotification]);

  // Crear espacio nuevo e ingresar
  const handleCreateNewSpace = () => {
    const newToken = generateToken();
    changeToken(newToken);
    showNotification(`¡Nuevo espacio creado!`, false);
    navigate("/");
  };

  // Ingresar con un token existente
  const handleEnterExistingSpace = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputToken.trim();
    if (!trimmed) {
      showNotification("Por favor ingresa un código o token válido", true);
      return;
    }
    changeToken(trimmed);
    showNotification("Espacio cargado exitosamente", false);
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-4 md:p-8 font-sans select-none"
      style={{ background: "#F0EDE4", color: "#1C1914" }}
    >
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm logo-flower"
            style={{ background: "#4A7856" }}
          >
            <FlowerIcon size={22} style={{ color: "#FFFFFF" }} />
          </div>
          <div>
            <h1
              className="text-2xl leading-none font-medium"
              style={{ fontFamily: "var(--font-display)", color: "#1C1914" }}
            >
              ClipSync
            </h1>
            <span className="text-xs text-petal-muted">
              Capture and sync without passwords
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div
          className="rounded-3xl p-6 md:p-8 border shadow-sm space-y-6 animate-fadeSlideUp"
          style={{ background: "#FAFAF7", borderColor: "#E5DED0" }}
        >
          <div className="text-center space-y-2">
            <div
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "#EBF2ED" }}
            >
              <FlowerIcon size={26} style={{ color: "#4A7856" }} />
            </div>
            <h2
              className="text-2xl font-serif leading-tight pt-2"
              style={{ fontFamily: "var(--font-display)", color: "#1C1914" }}
            >
              Your notes space
            </h2>
            <p className="text-xs text-petal-muted leading-relaxed max-w-xs mx-auto">
              Save web page selections and sync your devices without forms or passwords.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={handleCreateNewSpace}
              className="w-full py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group"
              style={{ background: "#4A7856" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#3D6647")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#4A7856")}
            >
              <PlusIcon size={16} />
              <span>Create a new instant space</span>
            </button>
            <p className="text-[0.72rem] text-center text-petal-muted">
              It will generate a unique random code to start immediately.
            </p>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-petal-border" />
            <span className="text-xs text-petal-muted uppercase font-medium tracking-wider">
              or enter with your code
            </span>
            <div className="flex-1 h-px bg-petal-border" />
          </div>

          <form onSubmit={handleEnterExistingSpace} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#6B6560] mb-1.5" htmlFor="space-token">
                Space code or token:
              </label>
              <input
                type="text"
                id="space-token"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Ej: clip_a8f92b"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
                style={{
                  background: "#FFFFFF",
                  borderColor: "#E5DED0",
                  color: "#1C1914",
                  fontFamily: "monospace",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!inputToken.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50"
              style={{
                background: "#FFFFFF",
                borderColor: "#E5DED0",
                color: "#1C1914",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F1E9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              Enter my space
            </button>
          </form>
          <div
            className="pt-4 border-t grid grid-cols-3 gap-2 text-center"
            style={{ borderColor: "#E5DED0" }}
          >
            <div className="flex flex-col items-center space-y-1">
              <Zap size={18} className="text-petal-green" />
              <p className="text-[0.68rem] text-petal-muted">No Registration</p>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Smartphone size={18} className="text-petal-green" />
              <p className="text-[0.68rem] text-petal-muted">Multi-device</p>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Puzzle size={18} className="text-petal-green" />
              <p className="text-[0.68rem] text-petal-muted">Extension Web</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-petal-muted py-4">
        ClipSync &copy; {new Date().getFullYear()} — Free login synchronization
      </footer>
    </div>
  );
}