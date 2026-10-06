async function loadComponent(id, path) {
  const response = await fetch(path);
  document.getElementById(id).innerHTML = await response.text();
}

async function loadComponents() {
  await loadComponent("header-component", "global/components/header/header.html");
  await loadComponent("sidebar-component", "global/components/sidebar/sidebar.html");

  const headerCss = document.createElement("link");
  headerCss.rel = "stylesheet";
  headerCss.href = "global/components/header/header.css";
  document.head.appendChild(headerCss);

  const sidebarCss = document.createElement("link");
  sidebarCss.rel = "stylesheet";
  sidebarCss.href = "global/components/sidebar/sidebar.css";
  document.head.appendChild(sidebarCss);

  const headerJs = document.createElement("script");
  headerJs.src = "global/components/header/header.js";
  document.body.appendChild(headerJs);

  const sidebarJs = document.createElement("script");
  sidebarJs.src = "global/components/sidebar/sidebar.js";
  sidebarJs.onload = function () {
    initSidebar();
  };
  document.body.appendChild(sidebarJs);
}

loadComponents();
