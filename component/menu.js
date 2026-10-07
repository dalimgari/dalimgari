const menuButton = document.querySelector("[data-menu-toggle]");
const sidebar = document.querySelector("[data-layout='sidebar']");

menuButton?.addEventListener("click", () => {
  const open = sidebar.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(open));
});
