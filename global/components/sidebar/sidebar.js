function initSidebar() {
  const menuButton = document.getElementById("menu-button");
  const sidebar = document.getElementById("sidebar");

  if (!menuButton || !sidebar) return;

  menuButton.addEventListener("click", function () {
    sidebar.classList.toggle("open");
  });
}
