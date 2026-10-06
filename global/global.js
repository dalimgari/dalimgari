const loaderScript = document.currentScript;
const globalBase = new URL("./", loaderScript.src);

const globalFeatures = [
  {
    name: "global-style",
    selector: null,
    css: "global-style/global-style.css"
  },
  {
    name: "button",
    selector: "button",
    css: "button/button.css"
  },
  {
    name: "input-box",
    selector: "input, textarea, select",
    css: "input-box/input-box.css"
  },
  {
    name: "output-box",
    selector: "output",
    css: "output-box/output-box.css"
  },
  {
    name: "avatar",
    selector: '[data-component="profile-avatar"]',
    css: "avatar/avatar.css"
  },
  {
    name: "header",
    selector: '[data-context="header"]',
    css: "header/header.css"
  },
  {
    name: "sidebar",
    selector: '[data-context="sidebar"]',
    css: "sidebar/sidebar.css"
  }
];

const globalContexts = [
  { name: "header", html: "contexts/header/header.html", css: "contexts/header/header.css" },
  { name: "sidebar", html: "contexts/sidebar/sidebar.html", css: "contexts/sidebar/sidebar.css" }
];

const globalComponents = [
  "components/header/header.js",
  "components/menu/menu.js",
  "components/profile-avatar/profile-avatar.js",
  "components/sidebar/sidebar.js"
];

function loadCss(path) {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL(path, globalBase);
  document.head.appendChild(style);
}

async function loadContext(context) {
  const response = await fetch(new URL(context.html, globalBase));
  if (!response.ok) throw new Error("Failed to load context: " + context.name);

  const target = document.createElement("div");
  target.id = context.name + "-context";
  target.innerHTML = await response.text();
  document.body.appendChild(target);

  if (context.css) loadCss(context.css);
}

function loadComponent(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(path, globalBase);
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load component: " + path));
    document.body.appendChild(script);
  });
}

function featureIsPresent(feature) {
  return !feature.selector || document.querySelector(feature.selector);
}

function applyGlobalFeatures() {
  for (const feature of globalFeatures) {
    if (featureIsPresent(feature) && feature.css) {
      loadCss(feature.css);
    }
  }
}

async function loadGlobalSystem() {
  for (const context of globalContexts) {
    await loadContext(context);
  }

  for (const component of globalComponents) {
    await loadComponent(component);
  }

  applyGlobalFeatures();
}

loadGlobalSystem().catch(console.error);
