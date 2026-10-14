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
          themeButton.innerHTML = isNight
            ? '<svg class="header-icon theme-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path></svg>'
            : '<svg class="header-icon theme-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.8 8.8 0 1 0 20.2 15.3Z"></path></svg>';
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