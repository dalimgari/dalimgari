    // Keep menu toggling and navigation functional even if the main app script fails.
    (() => {
      const menuButton = document.querySelector(".menu-button");
      const floatingMenu = document.querySelector("#floating-menu");
      if (!menuButton || !floatingMenu) return;

      // Persist the visitor's day/night preference independently of the language setting.
      const themeButton = document.querySelector("#theme-switcher");
      const themeStorageKey = "dalimgari-color-mode";
      const applyColorMode = (mode) => {
        const isNight = mode === "night";
        document.body.classList.toggle("dg-night-mode", isNight);
        if (themeButton) {
          themeButton.textContent = isNight ? "☀️" : "🌙";
          themeButton.setAttribute("aria-label", isNight ? "Switch to light mode" : "Switch to dark mode");
          themeButton.setAttribute("title", isNight ? "Switch to light mode" : "Switch to dark mode");
          themeButton.setAttribute("aria-pressed", String(isNight));
        }
      };
      let savedColorMode = "day";
      try { savedColorMode = localStorage.getItem(themeStorageKey) || "day"; } catch (_) {}
      applyColorMode(savedColorMode);
      if (themeButton) {
        themeButton.addEventListener("click", () => {
          const nextMode = document.body.classList.contains("dg-night-mode") ? "day" : "night";
          applyColorMode(nextMode);
          try { localStorage.setItem(themeStorageKey, nextMode); } catch (_) {}
        });
      }

      const closeMenu = () => {
        floatingMenu.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open menu");
      };

      menuButton.addEventListener("click", () => {
        const isOpening = floatingMenu.hidden;
        floatingMenu.hidden = !isOpening;
        menuButton.setAttribute("aria-expanded", String(isOpening));
        menuButton.setAttribute("aria-label", isOpening ? "Close menu" : "Open menu");
      });

      document.addEventListener("click", (event) => {
        if (!menuButton.contains(event.target) && !floatingMenu.contains(event.target)) closeMenu();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });

    })();