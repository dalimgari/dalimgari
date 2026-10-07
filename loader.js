// loader.js
// Priority 1: load global styles and the persistent website context.

const globalStylesheet = "/style/global-style.css";

const contextFiles = [
    { name: "header", html: "/context/header.html", css: "/context/header.css" },
    { name: "sidebar", html: "/context/sidebar.html", css: "/context/sidebar.css" },
    { name: "content", html: "/context/content.html", css: "/context/content.css" }
];

const pageFiles = {
    "content/home.html": "/content/home.html",
    "content/login.html": "/content/login.html",
    "content/create-account.html": "/content/create-account.html",
    "content/forgot-password.html": "/content/forgot-password.html",
    "content/profile.html": "/content/profile.html"
};

async function loadContextFile(file) {
    const [htmlResponse] = await Promise.all([
        fetch(file.html),
        loadStylesheet(file.css)
    ]);

    if (!htmlResponse.ok) {
        throw new Error(`Failed to load ${file.html}: ${htmlResponse.status}`);
    }

    return {
        name: file.name,
        html: await htmlResponse.text()
    };
}

function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`link[href="${href}"]`);

        if (existing) {
            resolve();
            return;
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = resolve;
        link.onerror = () => reject(new Error(`Failed to load ${href}`));
        document.head.appendChild(link);
    });
}

async function loadPage(path) {
    const content = document.getElementById("content");
    const pagePath = pageFiles[path] || pageFiles["content/home.html"];

    if (!content) {
        throw new Error("Missing content container: #content");
    }

    const response = await fetch(pagePath);

    if (!response.ok) {
        throw new Error(`Failed to load ${pagePath}: ${response.status}`);
    }

    content.innerHTML = await response.text();
    initializeComponents(content);
}

function initializeComponents(root) {
    import("/component/menu/menu.js")
        .then(({ initMenu }) => initMenu(root))
        .catch((error) => console.error("Menu initialization failed:", error));

    import("/component/search/search.js")
        .then(({ initSearch }) => initSearch(root))
        .catch((error) => console.error("Search initialization failed:", error));
}

function bindRoutes() {
    document.addEventListener("click", (event) => {
        const link = event.target.closest("[data-route]");

        if (!link) {
            return;
        }

        const path = link.dataset.route;

        if (!pageFiles[path]) {
            return;
        }

        event.preventDefault();
        window.location.hash = path;
    });

    window.addEventListener("hashchange", () => {
        const path = window.location.hash.slice(1) || "content/home.html";
        loadPage(path).catch((error) => console.error("Page loading failed:", error));
    });
}

async function initializeWebsite() {
    const app = document.getElementById("app");

    if (!app) {
        throw new Error("Missing root element: #app");
    }

    await loadStylesheet(globalStylesheet);

    const loaded = await Promise.all(contextFiles.map(loadContextFile));

    const context = document.createElement("div");
    context.id = "context";

    for (const file of loaded) {
        const section = document.createElement("section");
        section.dataset.context = file.name;
        section.innerHTML = file.html;
        context.appendChild(section);
    }

    app.replaceChildren(context);
    bindRoutes();

    const initialPath = window.location.hash.slice(1) || "content/home.html";
    await loadPage(initialPath);
}

// Priority 2: load reusable component assets after the critical context.
const priorityTwoModules = [
    "/component/avatar/avatar.html",
    "/component/menu/menu.html",
    "/component/menu/menu.css",
    "/component/search/search.html",
    "/component/search/search.css"
];

function preloadPriorityTwo() {
    return Promise.all(
        priorityTwoModules.map((path) => {
            if (path.endsWith(".html")) {
                return fetch(path).catch((error) => {
                    console.error(`Priority 2 preload failed: ${path}`, error);
                });
            }

            return loadStylesheet(path).catch((error) => {
                console.error(`Priority 2 stylesheet preload failed: ${path}`, error);
            });
        })
    );
}

// Priority 3: preload secondary page documents.
const priorityThreeModules = [
    "/content/create-account.html",
    "/content/forgot-password.html",
    "/content/login.html",
    "/content/profile.html"
];

function preloadPriorityThree() {
    return Promise.all(
        priorityThreeModules.map((path) =>
            fetch(path).catch((error) => {
                console.error(`Priority 3 preload failed: ${path}`, error);
            })
        )
    );
}

initializeWebsite()
    .then(preloadPriorityTwo)
    .then(preloadPriorityThree)
    .catch((error) => {
        console.error("Website initialization failed:", error);
    });
