const menuButton = document.querySelector("[data-menu-toggle]");
const sidebar = document.querySelector("[data-layout='sidebar']");

function toggleMenu() {
  const open = sidebar?.classList.toggle("is-open") ?? false;
  menuButton?.setAttribute("aria-expanded", String(open));
  sidebar?.setAttribute("aria-hidden", String(!open));
}

menuButton?.addEventListener("click", toggleMenu);

menuButton?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleMenu();
  }
});