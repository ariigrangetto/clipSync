import { useCallback } from "react";

export default function useNotification() {
    const showNotification = useCallback((message: string, isError: boolean = false) => {
        const host = document.createElement("div");
        host.id = "clipsync-toast-host";
        host.style.position = "fixed";
        host.style.bottom = "20px";
        host.style.right = "20px";
        host.style.zIndex = "99999999";

        const shadow = host.attachShadow({ mode: "open" });

        const toast = document.createElement("div");
        toast.innerText = message;

        Object.assign(toast.style, {
            backgroundColor: isError ? "#ef4444" : "#10b981",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            transition: "all 0.3s ease",
            opacity: "0",
            transform: "translateY(10px)",
        });

        shadow.appendChild(toast);
        document.body.appendChild(host);

        // Animacion
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";
        });

        // Desaparición tras 3 segundos
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(() => {
                host.remove();
            }, 300);
        }, 3000);
    }, []);

    return { showNotification };
}