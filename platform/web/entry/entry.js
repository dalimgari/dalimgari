// Web Entry

(async function startDalimgariWeb() {
  const dalimgari = window.Dalimgari;

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

  await dalimgari.webAdapter.loadScript("core/component/avatar.js");
  await dalimgari.webAdapter.loadScript("core/component/menu.js");
  await dalimgari.webAdapter.loadScript("core/component/sidebar.js");
  await dalimgari.webAdapter.loadScript("core/component/input.js");
  await dalimgari.webAdapter.loadScript("core/component/button.js");

  dalimgari.controller.subscribe((action, payload) => {
    if (action === "definition-change") {
      dalimgari.webRenderer.renderDefinition(payload.id);
    }
  });

  dalimgari.controller.setDefinition("login");
})();
