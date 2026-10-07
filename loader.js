// loader.js
// Priority 1: load the initial website context in parallel.

const contextFiles = [
    {
        name: "header",
        html: "/context/header.html",
        css: "/context/header.css"
    },
    {
        name: "sidebar",
        html: "/context/sidebar.html",
        css: "/context/sidebar.css"
    },
    {
        name: "content",
        html: "/context/content.html",
        css: "/context/content.css"
    }
];

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

async function initializeWebsite() {
    const app = document.getElementById("app");

    if (!app) {
        throw new Error('Missing root element: #app');
    }

    const loaded = await Promise.all(
        contextFiles.map(loadContextFile)
    );

    const context = document.createElement("div");
    context.id = "context";

    for (const file of loaded) {
        const section = document.createElement("section");
        section.dataset.context = file.name;
        section.innerHTML = file.html;
        context.appendChild(section);
    }

    app.replaceChildren(context);
}

// Priority 2: preload the initial content page and reusable components
// after the critical context has started loading.
const priorityTwoModules = [
    "/content/home.html",
    "/component/avatar/",
    "/component/menu/",
    "/component/search/"
];

function preloadPriorityTwo() {
    return Promise.all(
        priorityTwoModules.map((path) => {
            if (path.endsWith(".html")) {
                return fetch(path).catch((error) => {
                    console.error(`Priority 2 preload failed: ${path}`, error);
                });
            }

            return import(path).catch((error) => {
                console.error(`Priority 2 module preload failed: ${path}`, error);
            });
        })
    );
}


// Priority 3: preload secondary pages and the global stylesheet
// after Priority 2 has finished.
const priorityThreeModules = [
    "/content/create-account.html",
    "/content/forgot-password.html",
    "/content/login.html",
    "/content/profile.html",
    "/style/global-style.css"
];

function preloadPriorityThree() {
    return Promise.all(
        priorityThreeModules.map((path) => {
            if (path.endsWith(".css")) {
                return loadStylesheet(path).catch((error) => {
                    console.error(`Priority 3 stylesheet preload failed: ${path}`, error);
                });
            }

            return fetch(path).catch((error) => {
                console.error(`Priority 3 preload failed: ${path}`, error);
            });
        })
    );
}

initializeWebsite()
    .then(preloadPriorityTwo)
    .then(preloadPriorityThree)
    .catch((error) => {
        console.error("Website initialization failed:", error);
    });
