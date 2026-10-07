const contentArea = document.querySelector('[data-layout="content"]');

async function loadContentPage(path, updateHistory = true) {
  if (!contentArea) return;

  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error("HTTP " + response.status);

  const html = await response.text();
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  contentArea.replaceChildren(template.content.cloneNode(true));

  if (updateHistory) {
    history.pushState({ contentPage: path }, "", "#" + path);
  }
}

function getInitialContentPage() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return hash.startsWith("content/") ? hash : "content/home.html";
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  const contentButton = event.target.closest("[data-content-page]");

  if (link) {
    const path = link.getAttribute("href");

    if (path?.startsWith("content/")) {
      event.preventDefault();
      loadContentPage(path).catch(console.error);
      return;
    }
  }

  if (contentButton) {
    event.preventDefault();
    loadContentPage(contentButton.dataset.contentPage).catch(console.error);
  }
});

window.addEventListener("popstate", () => {
  loadContentPage(getInitialContentPage(), false).catch(console.error);
});

loadContentPage(getInitialContentPage(), false).catch(console.error);
