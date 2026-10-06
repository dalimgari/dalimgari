const menuSlot = document.querySelector('[data-context-slot="menu"]');

if (menuSlot && !menuSlot.querySelector("button")) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.size = "small";
  button.setAttribute("aria-label", "সাইডবার খুলুন");
  button.setAttribute("aria-expanded", "false");
  button.textContent = "Menu";

  button.addEventListener("click", () => {
    const sidebar = window.Dalimgari?.sidebar;
    if (!sidebar) return;

    const isOpen = sidebar.isOpen();
    sidebar.setOpen(!isOpen);

    button.setAttribute("aria-expanded", String(!isOpen));
    button.setAttribute(
      "aria-label",
      isOpen ? "সাইডবার খুলুন" : "সাইডবার বন্ধ করুন"
    );
  });

  menuSlot.appendChild(button);
}