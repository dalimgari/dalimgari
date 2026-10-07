// Search component behavior.

export function initSearch(root = document) {
    const search = root.querySelector("[data-search]");
    const input = search?.querySelector(".search__input");

    if (!search || !input) {
        return null;
    }

    return {
        search,
        input
    };
}
