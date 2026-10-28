// ClipSync Extension Content Script - Automatic Selection Capture (JWT-Only Auth)
(function () {
  let isEnabled = true;
  let activeAccessToken = "";
  let supabaseUrl = "";
  let supabaseKey = "";
  let lastSavedText = "";
  let lastSavedSource = "";

  // Cargar y actualizar configuración dinámicamente (solo JWT access_token)
  function refreshCredentials() {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.get(
          [
            "clipsync_autosave_enabled",
            "clipsync_access_token",
            "clipsync_supabase_url",
            "clipsync_supabase_key",
          ],
          (res) => {
            if (res) {
              if (res.clipsync_autosave_enabled !== undefined) {
                isEnabled =
                  res.clipsync_autosave_enabled === true ||
                  res.clipsync_autosave_enabled === "true";
              }
              activeAccessToken = res.clipsync_access_token || "";
              if (res.clipsync_supabase_url) {
                supabaseUrl = res.clipsync_supabase_url;
              }
              if (res.clipsync_supabase_key) {
                supabaseKey = res.clipsync_supabase_key;
              }
            }
            // Fallback secundario a localStorage únicamente en dominios de la web app ClipSync
            if (isClipSyncApp()) {
              try {
                if (!activeAccessToken && window.localStorage?.getItem("clipsync_access_token")) {
                  activeAccessToken = window.localStorage.getItem("clipsync_access_token") || "";
                }
                if (!supabaseUrl && window.localStorage?.getItem("clipsync_supabase_url")) {
                  supabaseUrl = window.localStorage.getItem("clipsync_supabase_url") || "";
                }
                if (!supabaseKey && window.localStorage?.getItem("clipsync_supabase_key")) {
                  supabaseKey = window.localStorage.getItem("clipsync_supabase_key") || "";
                }
              } catch {
              }
            }
            resolve();
          }
        );
      } else if (isClipSyncApp()) {
        try {
          const saved = localStorage.getItem("clipsync_autosave_enabled");
          isEnabled = saved === null ? true : saved === "true";
          activeAccessToken = localStorage.getItem("clipsync_access_token") || "";
          supabaseUrl = localStorage.getItem("clipsync_supabase_url") || "";
          supabaseKey = localStorage.getItem("clipsync_supabase_key") || "";
        } catch {
        }
        resolve();
      } else {
        resolve();
      }
    });
  }

  // 1. Carga inicial
  refreshCredentials();

  // 2. Escuchar actualizaciones dinámicas de almacenamiento de Chrome
  if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName && areaName !== "local") return;
      if (changes.clipsync_autosave_enabled) {
        isEnabled =
          changes.clipsync_autosave_enabled.newValue === true ||
          changes.clipsync_autosave_enabled.newValue === "true";
      }
      if (changes.clipsync_access_token) {
        activeAccessToken = changes.clipsync_access_token.newValue || "";
      }
      if (changes.clipsync_supabase_url) {
        supabaseUrl = changes.clipsync_supabase_url.newValue || "";
      }
      if (changes.clipsync_supabase_key) {
        supabaseKey = changes.clipsync_supabase_key.newValue || "";
      }
    });
  }

  // 3. Escuchar cambios de localStorage entre pestañas (únicamente en dominios de la web app ClipSync)
  window.addEventListener("storage", (e) => {
    if (!isClipSyncApp()) return;
    if (e.key === "clipsync_access_token") {
      activeAccessToken = e.newValue || "";
    }
    if (e.key === "clipsync_supabase_url") {
      supabaseUrl = e.newValue || "";
    }
    if (e.key === "clipsync_supabase_key") {
      supabaseKey = e.newValue || "";
    }
    if (e.key === "clipsync_autosave_enabled" && e.newValue !== null) {
      isEnabled = e.newValue === "true";
    }
  });

  // 4. Actualizar credenciales automáticamente cuando la pestaña gana foco o visibilidad
  window.addEventListener("focus", () => {
    refreshCredentials();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshCredentials();
    }
  });

  // Comprobar a través de la URL si el usuario se encuentra dentro de la web app ClipSync
  function isClipSyncApp() {
    try {
      const hostname = window.location.hostname;
      return (
        hostname === "clipsyncc-ashen.vercel.app" ||
        (hostname.endsWith(".vercel.app") && hostname.includes("clipsync")) ||
        hostname === "localhost" ||
        hostname === "127.0.0.1"
      );
    } catch {
      return false;
    }
  }

  // Puente (Bridge): Sincronizar el JWT desde la web app de ClipSync hacia chrome.storage.local (únicamente en dominios de la app)
  if (typeof window !== "undefined" && isClipSyncApp()) {
    // 1. Sincronización inicial si ya existe un JWT guardado en el localStorage de la web app
    try {
      const webAccessToken = window.localStorage.getItem("clipsync_access_token");
      const webUrl = window.localStorage.getItem("clipsync_supabase_url");
      const webKey = window.localStorage.getItem("clipsync_supabase_key");

      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        if (webAccessToken) {
          activeAccessToken = webAccessToken;
          if (webUrl) supabaseUrl = webUrl;
          if (webKey) supabaseKey = webKey;

          chrome.storage.local.set({
            clipsync_access_token: webAccessToken,
            clipsync_supabase_url: webUrl || supabaseUrl,
            clipsync_supabase_key: webKey || supabaseKey,
          });
        }
      }
    } catch {
    }

    // 2. Escuchar cambios de autenticación en tiempo real desde la web app mediante window.postMessage (validando estrictamente el origin)
    window.addEventListener("message", (event) => {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.type !== "CLIPSYNC_AUTH_STATE"
      ) {
        return;
      }

      if (event.data.action === "LOGIN" && event.data.accessToken) {
        activeAccessToken = event.data.accessToken;
        if (event.data.supabaseUrl) supabaseUrl = event.data.supabaseUrl;
        if (event.data.supabaseKey) supabaseKey = event.data.supabaseKey;

        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.set({
            clipsync_access_token: event.data.accessToken,
            clipsync_supabase_url: event.data.supabaseUrl || supabaseUrl,
            clipsync_supabase_key: event.data.supabaseKey || supabaseKey,
          });
        }
      } else if (event.data.action === "LOGOUT") {
        activeAccessToken = "";
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.remove(["clipsync_access_token"]);
        }
      }
    });
  }

  function showToast(message, isError = false) {
    const existing = document.getElementById("clipsync-toast-msg");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "clipsync-toast-msg";
    toast.style.background = isError ? "#7F1D1D" : "#1C1914";
    toast.style.color = "#FAFAF7";
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.zIndex = "2147483647";
    toast.style.padding = "10px 16px";
    toast.style.borderRadius = "12px";
    toast.style.fontSize = "13px";
    toast.style.fontWeight = "500";
    toast.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "8px";
    toast.style.fontFamily = "sans-serif";

    const indicator = document.createElement("span");
    indicator.style.width = "8px";
    indicator.style.height = "8px";
    indicator.style.borderRadius = "50%";
    indicator.style.background = isError ? "#EF4444" : "#4A7856";

    const label = document.createElement("span");
    label.textContent = message;

    toast.appendChild(indicator);
    toast.appendChild(label);

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "all 0.2s ease";
      setTimeout(() => toast.remove(), 200);
    }, 2200);
  }

  async function saveSelectionToClipSync(text) {
    const currentSource = window.location.href;

    // Evitar ejecutar autosave si el usuario ya está dentro de la web app ClipSync (comprobación por URL)
    if (isClipSyncApp()) {
      return;
    }

    // Refrescar credenciales en tiempo real antes de validar
    await refreshCredentials();

    // 1. Validar si existe un JWT firmado activo
    if (!supabaseUrl || !supabaseKey || !activeAccessToken) {
      lastSavedText = "";
      lastSavedSource = "";
      showToast("Please log in to ClipSync to save notes", true);
      return;
    }

    try {
      // 1. Check if a note already exists for current URL (RLS filters automatically by JWT auth.uid())
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/Notes?source=eq.${encodeURIComponent(
          currentSource
        )}&select=id,text`,
        {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${activeAccessToken}`,
          },
        }
      );

      const existingNotes = checkRes.ok ? await checkRes.json() : [];

      if (existingNotes && existingNotes.length > 0) {
        // 2. If it exists, append new text to existing note text
        const existingNote = existingNotes[0];
        const noteId = existingNote.id;
        const previousText = existingNote.text || "";
        const combinedText = previousText ? `${previousText}\n\n${text}` : text;

        const updateRes = await fetch(
          `${supabaseUrl}/rest/v1/Notes?id=eq.${noteId}`,
          {
            method: "PATCH",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${activeAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: combinedText }),
          }
        );

        if (updateRes.ok) {
          lastSavedText = text;
          lastSavedSource = currentSource;
          showToast("Note updated in ClipSync!");
        } else {
          lastSavedText = "";
        }
      } else {
        // 3. Otherwise create a new note (PostgreSQL sets user_token = auth.uid()::text via DEFAULT)
        const createRes = await fetch(`${supabaseUrl}/rest/v1/Notes`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${activeAccessToken}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            text: text,
            source: currentSource,
            category: "article",
            tags: ["extension"],
          }),
        });

        if (createRes.ok) {
          lastSavedText = text;
          lastSavedSource = currentSource;
          showToast("Saved to ClipSync!");
        } else {
          lastSavedText = "";
        }
      }
    } catch {
      lastSavedText = "";
    }
  }

  function handleMouseUp(e) {
    if (!isEnabled || isClipSyncApp()) return;

    const target = e.target;
    if (target?.closest?.("button")) {
      return;
    }

    setTimeout(() => {
      let selectedText = "";

      const activeEl = document.activeElement;
      const inputEl =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
          ? target
          : activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")
            ? activeEl
            : null;

      if (inputEl && inputEl.type !== "password") {
        try {
          const start = inputEl.selectionStart;
          const end = inputEl.selectionEnd;
          if (typeof start === "number" && typeof end === "number" && start !== end) {
            selectedText = inputEl.value.substring(start, end).trim();
          }
        } catch {
        }
      }

      if (!selectedText) {
        const selection = window.getSelection();
        selectedText = selection ? selection.toString().trim() : "";
      }

      const currentSource = window.location.href;

      if (
        selectedText.length >= 3 &&
        (selectedText !== lastSavedText || currentSource !== lastSavedSource)
      ) {
        saveSelectionToClipSync(selectedText);
      }
    }, 20);
  }

  document.addEventListener("mouseup", handleMouseUp);
})();
