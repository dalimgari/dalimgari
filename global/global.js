const loaderScript = document.currentScript;
const globalBase = new URL("./", loaderScript.src);

const globalFeatures = [
  { name: "variables", selector: null, css: "global-style/variables/variables.css" },
  { name: "reset", selector: null, css: "global-style/reset/reset.css" },
  { name: "body", selector: null, css: "global-style/body/body.css" },
  { name: "font", selector: null, css: "global-style/font/font.css" },
  { name: "link", selector: null, css: "global-style/link/link.css" },
  { name: "image", selector: null, css: "global-style/image/image.css" },
  { name: "focus", selector: null, css: "global-style/focus/focus.css" },
  { name: "spacing", selector: null, css: "global-style/spacing/spacing.css" },
  { name: "button", selector: "button", css: "button/button.css" },
  { name: "input-box", selector: "input, textarea, select", css: "input-box/input-box.css" },
  { name: "output-box", selector: "output", css: "output-box/output-box.css" },
  { name: "avatar", selector: '[data-component="profile-avatar"]', css: "avatar/avatar.css", js: "avatar/avatar.js" },
  { name: "header", selector: '[data-context="header"]', css: "header/header.css", html: "header/header.html", js: "header/header.js" },
  { name: "menu", selector: '[data-context-slot="menu"]', js: "menu/menu.js" },
  { name: "sidebar", selector: '[data-context="sidebar"]', css: "sidebar/sidebar.css", html: "sidebar/sidebar.html", js: "sidebar/sidebar.js" }
];

function loadCss(path) {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL(path, globalBase);
  document.head.appendChild(style);
}

function loadJs(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(path, globalBase);
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load feature: " + path));
    document.body.appendChild(script);
  });
}

async function loadHtml(feature) {
  const response = await fetch(new URL(feature.html, globalBase));
  if (!response.ok) throw new Error("Failed to load feature context: " + feature.name);

  const target = document.createElement("div");
  target.id = feature.name + "-context";
  target.innerHTML = await response.text();
  document.body.appendChild(target);
}

function featureIsPresent(feature) {
  return !feature.selector || document.querySelector(feature.selector);
}

async function loadGlobalSystem() {
  for (const feature of globalFeatures.filter(feature => !feature.selector && feature.css)) {
    loadCss(feature.css);
  }

  for (const feature of globalFeatures.filter(feature => feature.html)) {
    await loadHtml(feature);
  }

  for (const feature of globalFeatures) {
    if (!featureIsPresent(feature)) continue;
    if (feature.css && feature.selector) loadCss(feature.css);
    if (feature.js) await loadJs(feature.js);
  }
}

loadGlobalSystem().catch(console.error);
