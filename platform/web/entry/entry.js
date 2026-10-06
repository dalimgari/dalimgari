// Web Entry

(async function startDalimgariWeb() {
  try {
    const dalimgari = window.Dalimgari;
    let authReady = false;

    const styles = [
      "style/reset.css",
      "style/variables.css",
      "style/body.css",
      "style/font.css",
      "style/focus.css",
      "style/spacing.css",
      "style/button.css",
      "style/input-box.css",
      "style/output-box.css",
      "style/link.css",
      "style/image.css",
      "style/header.css",
      "style/sidebar.css",
      "style/avatar.css",
      "style/login.css"
    ];

    for (const path of styles) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = path;
      document.head.appendChild(link);
    }

    await dalimgari.webAdapter.mountContext("header");
    await dalimgari.webAdapter.mountContext("sidebar");
    await dalimgari.webAdapter.mountContext("content");

    for (const path of [
      "core/component/avatar.js",
      "core/component/menu.js",
      "core/component/sidebar.js",
      "core/component/input.js",
      "core/component/output.js",
      "core/component/button.js"
    ]) {
      await dalimgari.webAdapter.loadScript(path);
    }

    dalimgari.controller.subscribe((action, payload) => {
      if (action === "definition-change") {
        dalimgari.webRenderer.renderDefinition(payload.id);
        return;
      }

      if (action === "action-error") {
        const output = document.querySelector('output[name="message"]');
        if (output) output.textContent = payload.error?.message || "An error occurred.";
        return;
      }

      if (action === "action-success") {
        const output = document.querySelector('output[name="message"]');
        if (output) {
          output.textContent =
            payload.action === "reset-password"
              ? "Password reset email sent."
              : "";
        }
        return;
      }

      if (action === "auth-state-change") {
        authReady = true;
        const current = dalimgari.controller.getDefinition();

        if (payload.error) {
          const output = document.querySelector('output[name="message"]');
          if (output) output.textContent = payload.error.message || "Authentication initialization failed.";
          return;
        }

        if (payload.session) {
          if (!current || current === "login" || current === "register") {
            dalimgari.controller.setDefinition("home");
          }
        } else if (current === "home" || current === "profile") {
          dalimgari.controller.setDefinition("login");
        }
      }
    });

    await dalimgari.auth?.initialize();

    if (!authReady && !dalimgari.controller.getDefinition()) {
      dalimgari.controller.setDefinition("login");
    } else if (!dalimgari.controller.getDefinition()) {
      dalimgari.controller.setDefinition("login");
    }
  } catch (error) {
    console.error("Dalimgari startup error:", error);
  }
})();
