const loaderScript = document.currentScript;
const loaderBase = new URL("../", loaderScript.src);

const loaderStyle = document.createElement("style");
loaderStyle.id = "global-loader-style";
loaderStyle.textContent = "body { visibility: hidden; }";
document.head.appendChild(loaderStyle);

async function loadText(path) {
  const response = await fetch(new URL(path, loaderBase));
  if (!response.ok) throw new Error("Failed to load: " + path);
  return response.text();
}

async function loadStyle(path) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL(path, loaderBase);
  document.head.appendChild(link);
  await new Promise((resolve, reject) => {
    link.onload = resolve;
    link.onerror = reject;
  });
}

async function loadScript(path) {
  const script = document.createElement("script");
  script.src = new URL(path, loaderBase);
  document.body.appendChild(script);
  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
  });
}

async function loadGlobalComponents() {
  const components = [
    { id: "header-component", path: "components/header", name: "header" },
    { id: "sidebar-component", path: "components/sidebar", name: "sidebar" },
    { id: "menu-component", path: "components/menu", name: "menu" }
  ];

  for (const component of components) {
    let target = document.getElementById(component.id);

    if (!target) {
      target = document.createElement("div");
      target.id = component.id;
      document.body.prepend(target);
    }

    target.innerHTML = await loadText(component.path + "/" + component.name + ".html");
    await loadStyle(component.path + "/" + component.name + ".css");
    await loadScript(component.path + "/" + component.name + ".js");

    if (component.name === "sidebar" && typeof initSidebar === "function") {
      initSidebar();
    }
  }

  document.getElementById("global-loader-style").textContent = "body { visibility: visible; }";
}

loadGlobalComponents().catch(console.error);
