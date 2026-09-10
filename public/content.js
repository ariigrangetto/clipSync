// ClipSync Extension Content Script - Automatic Selection Capture
(function () {
  let isEnabled = true;
  let activeUserToken = "";
  let supabaseUrl = "";
  let supabaseKey = "";
  let lastSavedText = "";
  let lastSavedSource = "";

  // Cargar y actualizar configuración dinámicamente
  function refreshCredentials() {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.get(
          [
            "clipsync_autosave_enabled",
            "clipsync_user_token",
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
              if (res.clipsync_user_token) {
                activeUserToken = res.clipsync_user_token;
              }
              if (res.clipsync_supabase_url) {
                supabaseUrl = res.clipsync_supabase_url;
              }
              if (res.clipsync_supabase_key) {
                supabaseKey = res.clipsync_supabase_key;
              }
            }
            // Fallback secundario a localStorage si falta algún valor y existe
            try {
              if (!activeUserToken && window.localStorage?.getItem("clipsync_user_token")) {
                activeUserToken = window.localStorage.getItem("clipsync_user_token") || "";
              }
              if (!supabaseUrl && window.localStorage?.getItem("clipsync_supabase_url")) {
                supabaseUrl = window.localStorage.getItem("clipsync_supabase_url") || "";
              }
              if (!supabaseKey && window.localStorage?.getItem("clipsync_supabase_key")) {
                supabaseKey = window.localStorage.getItem("clipsync_supabase_key") || "";
              }
            } catch {
            }
            resolve();
          }
        );
      } else {
        try {
          const saved = localStorage.getItem("clipsync_autosave_enabled");
          isEnabled = saved === null ? true : saved === "true";
          activeUserToken = localStorage.getItem("clipsync_user_token") || "";
          supabaseUrl = localStorage.getItem("clipsync_supabase_url") || "";
          supabaseKey = localStorage.getItem("clipsync_supabase_key") || "";
        } catch {
        }
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
      if (changes.clipsync_user_token) {
        activeUserToken = changes.clipsync_user_token.newValue || "";
      }
      if (changes.clipsync_supabase_url) {
        supabaseUrl = changes.clipsync_supabase_url.newValue || "";
      }
      if (changes.clipsync_supabase_key) {
        supabaseKey = changes.clipsync_supabase_key.newValue || "";
      }
    });
  }

  // 3. Escuchar cambios de localStorage entre pestañas
  window.addEventListener("storage", (e) => {
    if (e.key === "clipsync_user_token") {
      activeUserToken = e.newValue || "";
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

  // Al no tener acceso a chrome.storage desde la app de ClipSync, se utiliza un intermedio que en este caso es content.js
  // Se leerán los datos guardados dentro del localStorage de la app y luego se enviarán a través de chrome.storage
  // Puente (Bridge): Sincronizar credenciales desde la web app de ClipSync hacia chrome.storage.local (únicamente en dominios de la app)
  if (typeof window !== "undefined" && isClipSyncApp()) {
    // 1. Sincronización inicial si ya existen credenciales guardadas en el localStorage de la web app
    try {
      const webToken = window.localStorage.getItem("clipsync_user_token");
      const webUrl = window.localStorage.getItem("clipsync_supabase_url");
      const webKey = window.localStorage.getItem("clipsync_supabase_key");
      const webUser = window.localStorage.getItem("clipsync_user_data");

      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        if (webToken) {
          activeUserToken = webToken;
          if (webUrl) supabaseUrl = webUrl;
          if (webKey) supabaseKey = webKey;

          chrome.storage.local.set({
            clipsync_user_token: webToken,
            clipsync_supabase_url: webUrl || supabaseUrl,
            clipsync_supabase_key: webKey || supabaseKey,
            clipsync_user_data: webUser || "",
          });
        }
      }
    } catch {
    }

    // 2. Escuchar cambios de autenticación en tiempo real desde la web app mediante window.postMessage (sin recargar la página)
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.data?.type !== "CLIPSYNC_AUTH_STATE") {
        return;
      }

      if (event.data.action === "LOGIN" && event.data.token) {
        activeUserToken = event.data.token;
        if (event.data.supabaseUrl) supabaseUrl = event.data.supabaseUrl;
        if (event.data.supabaseKey) supabaseKey = event.data.supabaseKey;

        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.set({
            clipsync_user_token: event.data.token,
            clipsync_supabase_url: event.data.supabaseUrl || supabaseUrl,
            clipsync_supabase_key: event.data.supabaseKey || supabaseKey,
            clipsync_user_data: event.data.user ? JSON.stringify(event.data.user) : "",
          });
        }
      } else if (event.data.action === "LOGOUT") {
        activeUserToken = "";
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.remove([
            "clipsync_user_token",
            "clipsync_user_data",
          ]);
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

    toast.innerHTML = `
      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isError ? "#EF4444" : "#4A7856"}"></span>
      <span>${message}</span>
    `;

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

    // Refrescar credenciales en tiempo real antes de validar (evita requerir recargar la página)
    await refreshCredentials();

    // 1. Validar si hay credenciales válidas (evitar spamear toasts si aún no inició sesión)
    if (!supabaseUrl || !supabaseKey || !activeUserToken) {
      // No bloquear la selección para que al iniciar sesión pueda volver a seleccionar el texto sin recargar
      lastSavedText = "";
      lastSavedSource = "";
      return;
    }

    try {
      // 1. Check if a note already exists for current URL and user (requesting id AND text)
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/Notes?source=eq.${encodeURIComponent(
          currentSource
        )}&user_token=eq.${encodeURIComponent(activeUserToken)}&select=id,text`,
        {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "x-user-token": activeUserToken,
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
          `${supabaseUrl}/rest/v1/Notes?id=eq.${noteId}&user_token=eq.${encodeURIComponent(
            activeUserToken
          )}`,
          {
            method: "PATCH",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "x-user-token": activeUserToken,
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
        // 3. Otherwise create a new note
        const createRes = await fetch(`${supabaseUrl}/rest/v1/Notes`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "x-user-token": activeUserToken,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            text: text,
            source: currentSource,
            category: "article",
            tags: ["extension"],
            user_token: activeUserToken,
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
    } catch (error) {
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

      // Si la selección ocurre en un input o textarea (excluyendo contraseñas por privacidad)
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
          // Ignorar tipos de input que no admiten selectionStart
        }
      }

      // Si no se obtuvo de un input/textarea, obtener la selección del DOM (texto normal y contenteditable)
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
