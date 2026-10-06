// Web Entry

(async function startDalimgariWeb() {
  try {
    const dalimgari = window.Dalimgari;
    const styles = ["style/reset.css","style/variables.css","style/body.css","style/font.css","style/focus.css","style/spacing.css","style/button.css","style/input-box.css","style/output-box.css","style/link.css","style/image.css","style/header.css","style/sidebar.css","style/avatar.css","style/login.css"];
    for (const path of styles) { const link = document.createElement("link"); link.rel = "stylesheet"; link.href = path; document.head.appendChild(link); }
    await dalimgari.webAdapter.mountContext("header");
    await dalimgari.webAdapter.mountContext("sidebar");
    await dalimgari.webAdapter.mountContext("content");
    for (const path of ["core/component/avatar.js","core/component/menu.js","core/component/sidebar.js","core/component/input.js","core/component/output.js","core/component/button.js"]) await dalimgari.webAdapter.loadScript(path);
    dalimgari.controller.subscribe((action, payload) => {
      if (action === "definition-change") dalimgari.webRenderer.renderDefinition(payload.id);
      if (action === "action-error") {
        const output = document.querySelector('output[name="message"]');
        if (output) output.textContent = payload.error?.message || "An error occurred.";
      }
      if (action === "action-success") {
        const output = document.querySelector('output[name="message"]');
        if (output) output.textContent = payload.action === "reset-password" ? "Password reset email sent." : "";
      }
      if (action === "auth-state-change" && payload.session && dalimgari.controller.getDefinition() === "login") dalimgari.controller.setDefinition("home");
    });
    await dalimgari.auth?.initialize();
    if (!dalimgari.controller.getDefinition()) dalimgari.controller.setDefinition("login");
  } catch (error) { console.error("Dalimgari startup error:", error); }
})();
