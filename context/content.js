const contentArea = document.querySelector('[data-layout="content"]');

async function loadContentPage(path) {
  if (!contentArea) return;

  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error("HTTP " + response.status);

  contentArea.innerHTML = await response.text();
  window.dispatchEvent(new CustomEvent("content:loaded", {
    detail: { path }
  }));
}

function getContentPage() {
  const path = window.location.hash.slice(1);
  return path || "content/home.html";
}

async function initContent() {
  await loadContentPage(getContentPage());
}

window.addEventListener("popstate", () => {
  loadContentPage(getContentPage()).catch(console.error);
});

initContent().catch(console.error);
