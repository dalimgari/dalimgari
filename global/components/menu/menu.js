function toggleSidebar(menuButton) {
  const sidebar = document.getElementById("sidebar-component");
  if (!sidebar) return;

  const isOpen = sidebar.dataset.open === "true";
  sidebar.dataset.open = String(!isOpen);
  sidebar.style.display = isOpen ? "none" : "block";

  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "সাইডবার খুলুন" : "সাইডবার বন্ধ করুন"
  );
}

document.addEventListener("click", (event) => {
  const menuButton = event.target.closest(".menu-button");
  if (!menuButton) return;

  toggleSidebar(menuButton);
});
