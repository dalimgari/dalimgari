const contentArea = document.querySelector('[data-layout="content"]');
const contentAssetState = {
  style: null,
  script: null
};

function normalizeContentPath(path) {
  if (!path) return null;

  const cleanPath = path.split("#")[0].split("?")[0];
  return cleanPath.startsWith("content/") ? cleanPath : null;
}

function getPageAssetPath(pagePath, extension) {
  const fileName = pagePath.split("/").pop().replace(/\.html$/i, "");
  return "content/" + fileName + "." + extension;
}

async function assetExists(path) {
  const response = await fetch(path, {
    method: "HEAD",
    cache: "no-cache"
  });

  return response.ok;
}

function removePageStyle() {
  contentAssetState.style?.remove();
  contentAssetState.style = null;
}

function removePageScript() {
  contentAssetState.script?.remove();
  contentAssetState.script = null;
}

async function loadContentStyle(pagePath) {
  removePageStyle();

  const pageStyle = getPageAssetPath(pagePath, "css");
  const defaultStyle = "context/content.css";
  const stylePath = (await assetExists(pageStyle)) ? pageStyle : defaultStyle;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = stylePath;
  link.dataset.contentAsset = "style";
  document.head.appendChild(link);

  contentAssetState.style = link;
}

async function loadContentScript(pagePath) {
  removePageScript();

  const pageScript = getPageAssetPath(pagePath, "js");
  const defaultScript = "context/content.js";
  const scriptPath = (await assetExists(pageScript))
    ? pageScript
    : (await assetExists(defaultScript) ? defaultScript : null);

  if (!scriptPath) return;

  const script = document.createElement("script");
  script.src = scriptPath;
  script.dataset.contentAsset = "script";

  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

  contentAssetState.script = script;
}

function syncActiveNavigation(path) {
  const normalizedPath = normalizeContentPath(path);

  document.querySelectorAll(".sidebar-button").forEach((button) => {
    const buttonPath = normalizeContentPath(
      button.getAttribute("href") || button.dataset.contentPage
    );

    button.classList.toggle(
      "is-active",
      Boolean(normalizedPath && buttonPath === normalizedPath)
    );
  });

  document.querySelectorAll("[data-content-link]").forEach((component) => {
    const componentPath = normalizeContentPath(
      component.getAttribute("href") || component.dataset.contentPage
    );

    component.classList.toggle(
      "is-active",
      Boolean(normalizedPath && componentPath === normalizedPath)
    );
  });
}

async function loadContentPage(path, updateHistory = true) {
  if (!contentArea) return;

  const normalizedPath = normalizeContentPath(path);
  if (!normalizedPath) return;

  const response = await fetch(normalizedPath, { cache: "no-cache" });
  if (!response.ok) throw new Error("HTTP " + response.status);

  const html = await response.text();
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  contentArea.replaceChildren(template.content.cloneNode(true));
  await loadContentStyle(normalizedPath);
  await loadContentScript(normalizedPath);
  syncActiveNavigation(normalizedPath);

  if (updateHistory) {
    history.pushState({ contentPage: normalizedPath }, "", "#" + normalizedPath);
  }
}

function getInitialContentPage() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return normalizeContentPath(hash) || "content/home.html";
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  const contentButton = event.target.closest("[data-content-page]");

  if (link) {
    const path = link.getAttribute("href");

    if (normalizeContentPath(path)) {
      event.preventDefault();
      loadContentPage(path).catch(console.error);
      return;
    }
  }

  if (contentButton) {
    const path = contentButton.dataset.contentPage;

    if (normalizeContentPath(path)) {
      event.preventDefault();
      loadContentPage(path).catch(console.error);
    }
  }
});

window.addEventListener("popstate", () => {
  loadContentPage(getInitialContentPage(), false).catch(console.error);
});

loadContentPage(getInitialContentPage(), false).catch(console.error);
