const loaderScript = document.currentScript;
const globalBase = new URL("../", loaderScript.src);

function loadJs(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(path, globalBase);
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load feature: " + path));
    document.body.appendChild(script);
  });
}

function loadCss(path) {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL(path, globalBase);
  document.head.appendChild(style);
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
  await loadJs("registry/registry.js");

  const features = window.Dalimgari.registry;

  for (const feature of features.filter(feature => !feature.selector && feature.css)) {
    loadCss(feature.css);
  }

  for (const feature of features.filter(feature => feature.html)) {
    await loadHtml(feature);
  }

  for (const feature of features) {
    if (!featureIsPresent(feature)) continue;
    if (feature.css && feature.selector) loadCss(feature.css);
    if (feature.js) await loadJs(feature.js);
  }
}

loadGlobalSystem().catch(console.error);
