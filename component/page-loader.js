const contentArea = document.querySelector('[data-layout="content"]');

function normalizeContentPath(path) {
  if (!path) return null;

  const cleanPath = path.split("#")[0].split("?")[0];
  return cleanPath.startsWith("content/") ? cleanPath : null;
}

function closeSidebar() {
  const sidebar = document.querySelector('[data-layout="sidebar"]');
  const menuButton = document.querySelector("[data-menu-toggle]");

  if (!sidebar) return;

  sidebar.classList.remove("is-open");
  sidebar.setAttribute("aria-hidden", "true");
  menuButton?.setAttribute("aria-expanded", "false");
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
  syncActiveNavigation(normalizedPath);
  closeSidebar();

  if (updateHistory) {
    history.pushState({ contentPage: normalizedPath }, "", "#" + normalizedPath);
  }
}

function getInitialContentPage() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return normalizeContentPath(hash) || "content/home.html";
}

contentArea?.addEventListener("click", () => {
  closeSidebar();
});

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
