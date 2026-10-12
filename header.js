    // Keep menu toggling and navigation functional even if the main app script fails.
    (() => {
      const menuButton = document.querySelector(".menu-button");
      const floatingMenu = document.querySelector("#floating-menu");
      if (!menuButton || !floatingMenu) return;

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