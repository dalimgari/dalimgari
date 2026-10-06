const loaderScript = document.currentScript;
const loaderBase = new URL("../", loaderScript.src);

async function loadComponent(id, path) {
  const response = await fetch(new URL(path, loaderBase));
  document.getElementById(id).innerHTML = await response.text();
}

async function loadComponents() {
  if (!document.getElementById("header-component")) {
    const header = document.createElement("div");
    header.id = "header-component";
    document.body.prepend(header);
  }

  if (!document.getElementById("sidebar-component")) {
    const sidebar = document.createElement("div");
    sidebar.id = "sidebar-component";
    document.body.appendChild(sidebar);
  }

  await loadComponent("header-component", "components/header/header.html");
  await loadComponent("sidebar-component", "components/sidebar/sidebar.html");

  const headerCss = document.createElement("link");
  headerCss.rel = "stylesheet";
  headerCss.href = new URL("components/header/header.css", loaderBase);
  document.head.appendChild(headerCss);

  const sidebarCss = document.createElement("link");
  sidebarCss.rel = "stylesheet";
  sidebarCss.href = new URL("components/sidebar/sidebar.css", loaderBase);
  document.head.appendChild(sidebarCss);

  const headerJs = document.createElement("script");
  headerJs.src = new URL("components/header/header.js", loaderBase);
  document.body.appendChild(headerJs);

  const sidebarJs = document.createElement("script");
  sidebarJs.src = new URL("components/sidebar/sidebar.js", loaderBase);
  sidebarJs.onload = function () {
    initSidebar();
  };
  document.body.appendChild(sidebarJs);
}

loadComponents();
