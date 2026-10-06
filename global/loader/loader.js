const loaderScript = document.currentScript;
const loaderBase = new URL("../../", loaderScript.src);
const repositoryTreeUrl = "https://api.github.com/repos/dalimgari/dalimgari/git/trees/main?recursive=1";

async function getRepositoryTree() {
  const response = await fetch(repositoryTreeUrl);
  if (!response.ok) throw new Error("Failed to discover global files.");

  const tree = await response.json();
  if (tree.truncated) throw new Error("Global file tree is truncated.");

  return tree.tree;
}

function getFiles(tree, prefix, extension) {
  return tree
    .filter(item => item.type === "blob" && item.path.startsWith(prefix))
    .filter(item => !extension || item.path.endsWith(extension))
    .map(item => item.path);
}

async function loadStyles(tree) {
  const stylePaths = getFiles(tree, "global/styles/", ".css");

  for (const path of stylePaths) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = new URL(path, loaderBase);
    document.head.appendChild(style);
  }
}

async function loadContexts(tree) {
  const contextFiles = getFiles(tree, "global/contexts/", ".html");
  const contextNames = [...new Set(
    contextFiles.map(path => path.split("/")[2])
  )];

  for (const name of contextNames) {
    const directory = new URL("global/contexts/" + name + "/", loaderBase);
    const htmlPath = contextFiles.find(path => path === "global/contexts/" + name + "/" + name + ".html");

    if (!htmlPath) continue;

    const response = await fetch(new URL(name + ".html", directory));
    if (!response.ok) throw new Error("Failed to load context: " + name);

    const target = document.createElement("div");
    target.id = name + "-context";
    target.innerHTML = await response.text();
    document.body.appendChild(target);

    const cssPath = "global/contexts/" + name + "/" + name + ".css";
    if (tree.some(item => item.type === "blob" && item.path === cssPath)) {
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = new URL(cssPath, loaderBase);
      document.head.appendChild(style);
    }
  }
}

async function loadComponents(tree) {
  const jsPaths = getFiles(tree, "global/components/", ".js");

  for (const path of jsPaths) {
    const parts = path.split("/");
    if (parts.length !== 4) continue;

    const component = parts[2];
    const file = parts[3];
    const script = document.createElement("script");
    script.src = new URL("global/components/" + component + "/" + file, loaderBase);
    document.body.appendChild(script);

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load component: " + path));
    });
  }
}

async function loadGlobalSystem() {
  const tree = await getRepositoryTree();

  await loadStyles(tree);
  await loadContexts(tree);
  await loadComponents(tree);
}

loadGlobalSystem().catch(console.error);
