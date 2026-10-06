const components = [
  {
    id: "header-component",
    path: "global/components/header",
    name: "header"
  },
  {
    id: "sidebar-component",
    path: "global/components/sidebar",
    name: "sidebar"
  }
];

function createFloatingLayer() {
  let layer = document.getElementById("global-loader-layer");

  if (!layer) {
    layer = document.createElement("div");
    layer.id = "global-loader-layer";
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.zIndex = "9999";
    layer.style.pointerEvents = "none";
    document.body.appendChild(layer);
  }

  return layer;
}

async function loadComponent(component, layer) {
  const base = new URL("../../", document.currentScript.src);
  const directory = new URL(component.path + "/", base);

  const htmlResponse = await fetch(
    new URL(component.name + ".html", directory)
  );

  if (!htmlResponse.ok) {
    throw new Error("Failed to load: " + component.name + ".html");
  }

  let target = document.getElementById(component.id);

  if (!target) {
    target = document.createElement("div");
    target.id = component.id;
    target.style.pointerEvents = "auto";
    layer.appendChild(target);
  }

  target.innerHTML = await htmlResponse.text();

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL(component.name + ".css", directory);
  document.head.appendChild(style);

  const script = document.createElement("script");
  script.src = new URL(component.name + ".js", directory);
  document.body.appendChild(script);
}

async function loadGlobalComponents() {
  const layer = createFloatingLayer();

  for (const component of components) {
    await loadComponent(component, layer);
  }
}

loadGlobalComponents().catch(console.error);
