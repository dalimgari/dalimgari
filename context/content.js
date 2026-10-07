const contentArea = document.querySelector('[data-layout="content"]');

function normalizeContentPath(path) {
  if (!path) return "content/home.html";

  const cleanPath = path.split("#")[0].split("?")[0];
  return cleanPath.replace(/^\.\//, "");
}

function getContentPage() {
  const hashPath = window.location.hash.slice(1);
  return normalizeContentPath(hashPath || "content/home.html");
}

async function loadContentPage(path, { updateHistory = false } = {}) {
  if (!contentArea) return;

  const contentPath = normalizeContentPath(path);
  if (!contentPath.startsWith("content/") || !contentPath.endsWith(".html")) {
    throw new Error("Invalid content page: " + contentPath);
  }

  const response = await fetch(contentPath, { cache: "no-cache" });
  if (!response.ok) throw new Error("HTTP " + response.status);

  contentArea.innerHTML = await response.text();

  if (updateHistory) {
    history.pushState({ contentPath }, "", "#" + contentPath);
  }

  window.dispatchEvent(new CustomEvent("content:loaded", {
    detail: { path: contentPath }
  }));
}

function isContentLink(link) {
  if (!link) return false;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("#")) return false;

  const url = new URL(href, window.location.href);
  const path = normalizeContentPath(url.pathname.replace(/^\//, ""));

  return url.origin === window.location.origin &&
    path.startsWith("content/") &&
    path.endsWith(".html");
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!isContentLink(link)) return;

  event.preventDefault();

  const url = new URL(link.href, window.location.href);
  const path = normalizeContentPath(url.pathname.replace(/^\//, ""));

  loadContentPage(path, { updateHistory: true }).catch(console.error);
});

window.addEventListener("hashchange", () => {
  loadContentPage(getContentPage()).catch(console.error);
});

window.addEventListener("popstate", () => {
  loadContentPage(getContentPage()).catch(console.error);
});

window.dalimgariContent = {
  load: loadContentPage,
  getPath: getContentPage
};

loadContentPage(getContentPage()).catch(console.error);
