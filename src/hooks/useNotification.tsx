import { useCallback } from "react";

export default function useNotification() {
    const showNotification = useCallback((message: string, isError: boolean = false) => {
        const host = document.createElement("div");
        host.id = "clipsync-toast-host";
        host.style.position = "fixed";
        host.style.bottom = "24px";
        host.style.right = "24px";
        host.style.zIndex = "99999999";
        host.style.pointerEvents = "none";

        const shadow = host.attachShadow({ mode: "open" });

        const toast = document.createElement("div");
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");

        Object.assign(toast.style, {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 16px 9px 11px",
            borderRadius: "14px",
            backgroundColor: "rgba(20, 23, 21, 0.94)",
            backdropFilter: "blur(12px)",
            webkitBackdropFilter: "blur(12px)",
            border: `1px solid ${isError ? "rgba(248, 113, 113, 0.3)" : "rgba(126, 198, 145, 0.28)"}`,
            boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.55), 0 4px 12px rgba(0, 0, 0, 0.3)",
            color: "#EDEDEA",
            fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "13px",
            fontWeight: "500",
            lineHeight: "1.4",
            letterSpacing: "-0.01em",
            transition: "all 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
            opacity: "0",
            transform: "translateY(12px) scale(0.96)",
            pointerEvents: "auto",
            maxWidth: "380px",
        });

        // Icon Badge
        const iconBadge = document.createElement("div");
        Object.assign(iconBadge.style, {
            width: "26px",
            height: "26px",
            borderRadius: "9px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: "0",
            backgroundColor: isError ? "rgba(239, 68, 68, 0.16)" : "rgba(94, 158, 110, 0.18)",
            color: isError ? "#F87171" : "#7EC691",
        });

        iconBadge.innerHTML = isError
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>`;

        // Message text
        const textSpan = document.createElement("span");
        textSpan.innerText = message;
        textSpan.style.wordBreak = "break-word";

        toast.appendChild(iconBadge);
        toast.appendChild(textSpan);
        shadow.appendChild(toast);
        document.body.appendChild(host);

        // Animation in
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0) scale(1)";
        });

        // Animation out & cleanup
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(8px) scale(0.98)";
            setTimeout(() => {
                host.remove();
            }, 320);
        }, 3200);
    }, []);

    return { showNotification };
}
