function loadHeaderStyles() {
  if (document.getElementById("header-component-css")) return;
  const link = document.createElement("link");
  link.id = "header-component-css";
  link.rel = "stylesheet";
  link.href = "global/components/header/header.css";
  document.head.appendChild(link);
}

loadHeaderStyles();
