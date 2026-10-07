const pages = [
    { title: "Home", path: "content/home.html" },
    { title: "Login", path: "content/login.html" },
    { title: "Create account", path: "content/create-account.html" },
    { title: "Forgot password", path: "content/forgot-password.html" },
    { title: "Profile", path: "content/profile.html" }
];

export function initSearch(root = document) {
    const search = root.querySelector("[data-search]");
    const input = search?.querySelector(".search__input");
    const results = search?.querySelector("[data-search-results]");
    if (!search || !input || !results) return;

    const render = (query = "") => {
        const normalized = query.trim().toLowerCase();
        const matches = pages.filter((page) => !normalized || page.title.toLowerCase().includes(normalized));
        results.replaceChildren(...matches.map((page) => {
            const link = document.createElement("a");
            link.href = `#${page.path}`;
            link.dataset.route = page.path;
            link.textContent = page.title;
            return link;
        }));
        results.hidden = matches.length === 0;
    };

    input.addEventListener("input", () => render(input.value));
    render();
}