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

initializeWebsite().catch((error) => {
    console.error("Website initialization failed:", error);
});
