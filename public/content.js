// ClipSync Extension Content Script - Automatic Selection Capture
(function () {
  let isEnabled = true;
  let activeUserToken = "";
  let supabaseUrl = "";
  let supabaseKey = "";
  let lastSavedText = "";
  let lastSavedSource = "";

  // Cargar configuración de forma dinámica únicamente desde el almacenamiento local del usuario
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get(
      [
        "clipsync_autosave_enabled",
        "clipsync_user_token",
        "clipsync_supabase_url",
        "clipsync_supabase_key",
      ],
      (res) => {
        if (res.clipsync_autosave_enabled !== undefined) {
          isEnabled = res.clipsync_autosave_enabled;
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
    );

    // Escuchar actualizaciones dinámicas de almacenamiento
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.clipsync_autosave_enabled) {
        isEnabled = changes.clipsync_autosave_enabled.newValue;
      }
      if (changes.clipsync_user_token) {
        activeUserToken = changes.clipsync_user_token.newValue;
      }
      if (changes.clipsync_supabase_url) {
        supabaseUrl = changes.clipsync_supabase_url.newValue;
      }
      if (changes.clipsync_supabase_key) {
        supabaseKey = changes.clipsync_supabase_key.newValue;
      }
    });
  } else {
    // Fallback dinámico usando localStorage (sin valores por defecto ni claves expuestas)
    const saved = localStorage.getItem("clipsync_autosave_enabled");
    isEnabled = saved === null ? true : saved === "true";
    activeUserToken = localStorage.getItem("clipsync_user_token") || "";
    supabaseUrl = localStorage.getItem("clipsync_supabase_url") || "";
    supabaseKey = localStorage.getItem("clipsync_supabase_key") || "";
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

    // Si la extensión se comunica con la app mediante mensajes runtime
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: "CLIPSYNC_SAVE_NOTE",
          payload: { text, source: currentSource },
        },
        (response) => {
          if (response?.success) {
            showToast("¡Nota actualizada en ClipSync!");
          }
        }
      );
    }

    if (!supabaseUrl || !supabaseKey || !activeUserToken) {
      return;
    }

    try {
      // 1. Comprobar si ya existe una nota guardada para la URL (source) actual de este usuario
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/Notes?source=eq.${encodeURIComponent(
          currentSource
        )}&user_token=eq.${encodeURIComponent(activeUserToken)}&select=id`,
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
        // 2. Si ya existe una nota con esa misma URL, se actualiza el texto de esa misma nota
        const noteId = existingNotes[0].id;
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
            body: JSON.stringify({ text: text }),
          }
        );

        if (updateRes.ok) {
          showToast("¡Nota actualizada en ClipSync!");
        }
      } else {
        // 3. Si no existe ninguna nota para esta URL, se crea una nueva nota
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
          showToast("¡Guardado en ClipSync!");
        }
      }
    } catch (error) {
      // Ignorar errores silenciosamente
    }
  }

  function handleMouseUp(e) {
    if (!isEnabled) return;

    const target = e.target;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable ||
      target.closest?.("button")
    ) {
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "";
      const currentSource = window.location.href;

      if (
        selectedText.length >= 3 &&
        (selectedText !== lastSavedText || currentSource !== lastSavedSource)
      ) {
        lastSavedText = selectedText;
        lastSavedSource = currentSource;
        saveSelectionToClipSync(selectedText);
      }
    }, 20);
  }

  document.addEventListener("mouseup", handleMouseUp);
})();
