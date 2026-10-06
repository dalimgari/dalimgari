const loaderScript = document.currentScript;
const loaderBase = new URL("../../", loaderScript.src);

const components = [
  { id: "header-component", path: "global/components/header", name: "header", script: true },
  { id: "sidebar-component", path: "global/components/sidebar", name: "sidebar", script: false }
];

function createFloatingLayer() {
  let layer = document.getElementById("global-loader-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "global-loader-layer";
    Object.assign(layer.style, { position: "fixed", inset: "0", zIndex: "9999", pointerEvents: "none" });
    document.body.appendChild(layer);
  }
  return layer;
}

async function loadComponent(component, layer) {
  const directory = new URL(component.path + "/", loaderBase);
  const htmlResponse = await fetch(new URL(component.name + ".html", directory));
  if (!htmlResponse.ok) throw new Error("Failed to load: " + component.name + ".html");

  const target = document.createElement("div");
  target.id = component.id;
  target.style.pointerEvents = "auto";
  target.innerHTML = await htmlResponse.text();
  layer.appendChild(target);

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL(component.name + ".css", directory);
  document.head.appendChild(style);

  if (component.script) {
    const script = document.createElement("script");
    script.src = new URL(component.name + ".js", directory);
    document.body.appendChild(script);
  }
}

async function loadGlobalComponents() {
  const layer = createFloatingLayer();
  for (const component of components) await loadComponent(component, layer);
}

loadGlobalComponents().catch(console.error);
