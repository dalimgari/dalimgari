const loaderScript = document.currentScript;
const loaderBase = new URL("../../", loaderScript.src);
const repositoryTreeUrl = "https://api.github.com/repos/dalimgari/dalimgari/git/trees/main?recursive=1";

function createFloatingLayer() {
  let layer = document.getElementById("global-loader-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "global-loader-layer";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "9999",
      pointerEvents: "none"
    });
    document.body.appendChild(layer);
  }
  return layer;
}

function getComponents(tree) {
  const files = tree
    .filter(item => item.type === "blob" && item.path.startsWith("global/components/"))
    .map(item => item.path);

  const componentNames = new Set();

  for (const path of files) {
    const parts = path.split("/");
    if (parts.length === 4) componentNames.add(parts[2]);
  }

  return [...componentNames].map(name => {
    const prefix = "global/components/" + name + "/";
    return {
      name,
      files: files.filter(path => path.startsWith(prefix))
    };
  });
}

async function loadComponent(component, layer) {
  const directory = new URL("global/components/" + component.name + "/", loaderBase);

  const htmlPath = component.files.find(path => path.endsWith(".html"));
  if (htmlPath) {
    const htmlResponse = await fetch(new URL(htmlPath.split("/").pop(), directory));
    if (!htmlResponse.ok) throw new Error("Failed to load: " + htmlPath);

    const target = document.createElement("div");
    target.id = component.name + "-component";
    target.style.pointerEvents = "auto";
    target.innerHTML = await htmlResponse.text();
    layer.appendChild(target);
  }

  const cssPath = component.files.find(path => path.endsWith(".css"));
  if (cssPath) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = new URL(cssPath.split("/").pop(), directory);
    document.head.appendChild(style);
  }
}

async function loadComponentScripts(components) {
  for (const component of components) {
    const directory = new URL("global/components/" + component.name + "/", loaderBase);
    const jsPath = component.files.find(path => path.endsWith(".js"));
    if (!jsPath) continue;

    const script = document.createElement("script");
    script.src = new URL(jsPath.split("/").pop(), directory);
    document.body.appendChild(script);
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load: " + jsPath));
    });
  }
}

async function loadGlobalComponents() {
  const layer = createFloatingLayer();
  const response = await fetch(repositoryTreeUrl);
  if (!response.ok) throw new Error("Failed to discover global components.");

  const tree = await response.json();
  if (tree.truncated) throw new Error("Global component tree is truncated.");

  const components = getComponents(tree.tree);

  for (const component of components) {
    await loadComponent(component, layer);
  }

  await loadComponentScripts(components);
}

loadGlobalComponents().catch(console.error);
