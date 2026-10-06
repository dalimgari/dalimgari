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

async function loadComponent(component) {
  const base = new URL("../../", document.currentScript.src);
  const directory = new URL(component.path + "/", base);

  const htmlResponse = await fetch(
    new URL(component.name + ".html", directory)
  );

  if (!htmlResponse.ok) {
    throw new Error("Failed to load: " + component.name + ".html");
  }

  const target = document.getElementById(component.id);

  if (!target) {
    throw new Error("Missing target: #" + component.id);
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
  for (const component of components) {
    await loadComponent(component);
  }
}

loadGlobalComponents().catch(console.error);
