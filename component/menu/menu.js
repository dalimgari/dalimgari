export function initMenu(root = document) {
    const toggle = root.querySelector("[data-menu] .menu__toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
        const menu = toggle.closest("[data-menu]");
        const list = menu?.querySelector(".menu__list");
        if (!list) return;
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        list.hidden = expanded;
    });
}