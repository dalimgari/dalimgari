const loaderScript = document.currentScript;
const loaderBase = new URL("../", loaderScript.src);

function loadText(path) {
  return fetch(new URL(path, loaderBase)).then(response => {
    if (!response.ok) throw new Error("Failed to load: " + path);
    return response.text();
  });
}

function loadStyle(path) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL(path, loaderBase);
  document.head.appendChild(link);
}

function loadScript(path) {
  const script = document.createElement("script");
  script.src = new URL(path, loaderBase);
  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function loadGlobalComponents() {
  const components = [
    { id: "header-component", path: "components/header", name: "header" },
    { id: "sidebar-component", path: "components/sidebar", name: "sidebar" },
    { id: "menu-component", path: "components/menu", name: "menu" }
  ];

  await Promise.all(components.map(async component => {
    let target = document.getElementById(component.id);

    if (!target) {
      target = document.createElement("div");
      target.id = component.id;
      document.body.prepend(target);
    }

    target.innerHTML = await loadText(
      component.path + "/" + component.name + ".html"
    );

    loadStyle(component.path + "/" + component.name + ".css");
    await loadScript(component.path + "/" + component.name + ".js");
  }));

  if (typeof initSidebar === "function") {
    initSidebar();
  }
}

loadGlobalComponents().catch(console.error);
