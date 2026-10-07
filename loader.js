// loader.js
// Central application loader: global styles, persistent context, routing and components.

import { initContent } from "./context/content.js";

const globalStylesheet = "./style/global-style.css";
const contextFiles = [
    { name: "header", html: "./context/header.html", css: "./context/header.css" },
    { name: "sidebar", html: "./context/sidebar.html", css: "./context/sidebar.css" },
    { name: "content", html: "./context/content.html", css: "./context/content.css" }
];
const contextLayoutStylesheet = "./context/layout.css";

const pageFiles = {
    "content/home.html": "./content/home.html",
    "content/login.html": "./content/login.html",
    "content/create-account.html": "./content/create-account.html",
    "content/forgot-password.html": "./content/forgot-password.html",
    "content/profile.html": "./content/profile.html"
};

const protectedRoutes = new Set(["content/profile.html"]);

const componentFiles = {
    avatar: { html: "./component/avatar/avatar.html", css: "./component/avatar/avatar.css", js: "./component/avatar/avatar.js" },
    menu: { html: "./component/menu/menu.html", css: "./component/menu/menu.css", js: "./component/menu/menu.js" },
    search: { html: "./component/search/search.html", css: "./component/search/search.css", js: "./component/search/search.js" }
};

const componentTemplateCache = new Map();

function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`link[href="${href}"]`);
        if (existing) return resolve();
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = resolve;
        link.onerror = () => reject(new Error(`Failed to load ${href}`));
        document.head.appendChild(link);
    });
}

async function loadContextFile(file) {
    const [htmlResponse] = await Promise.all([fetch(file.html), loadStylesheet(file.css)]);
    if (!htmlResponse.ok) throw new Error(`Failed to load ${file.html}: ${htmlResponse.status}`);
    return { name: file.name, html: await htmlResponse.text() };
}

async function loadComponentTemplate(name) {
    if (componentTemplateCache.has(name)) return componentTemplateCache.get(name);
    const component = componentFiles[name];
    if (!component) throw new Error(`Unknown component: ${name}`);
    const [response] = await Promise.all([fetch(component.html), loadStylesheet(component.css)]);
    if (!response.ok) throw new Error(`Failed to load ${component.html}: ${response.status}`);
    const html = await response.text();
    componentTemplateCache.set(name, html);
    return html;
}

async function mountComponents(root) {
    const placeholders = [...root.querySelectorAll("[data-component]")];
    await Promise.all(placeholders.map(async (placeholder) => {
        const name = placeholder.dataset.component;
        if (!componentFiles[name]) {
            console.warn(`Unknown component placeholder: ${name}`);
            return;
        }
        try {
            placeholder.outerHTML = await loadComponentTemplate(name);
        } catch (error) {
            console.error(`Component mount failed: ${name}`, error);
        }
    }));
}

async function initializeComponents(root) {
    await mountComponents(root);
    const tasks = [];
    for (const [name, component] of Object.entries(componentFiles)) {
        if (component.js && root.querySelector(`[data-${name}]`)) {
            tasks.push(import(component.js));
        }
    }
    const modules = await Promise.all(tasks);
    for (const module of modules) {
        if (module.initMenu) module.initMenu(root);
        if (module.initSearch) module.initSearch(root);
        if (module.initAvatar) module.initAvatar(root);
    }
}

function showLoaderError(message) {
    const content = initContent();
    if (content) {
        content.innerHTML = `<section class="page page-error"><h1>Unable to load this page</h1><p>${message}</p></section>`;
    }
}

async function requireRouteAccess(path) {
    if (!protectedRoutes.has(path)) return true;
    const auth = window.dalimgariAuth;
    if (!auth?.getSession) return false;
    const session = await auth.getSession();
    if (session) return true;
    if (window.location.hash !== "#content/login.html") {
        window.location.hash = "content/login.html";
    }
    return false;
}

async function loadPage(path) {
    const content = initContent();
    const pagePath = pageFiles[path] || pageFiles["content/home.html"];
    if (!content) throw new Error("Missing content container: #content");
    if (!(await requireRouteAccess(pagePath))) return;

    const response = await fetch(pagePath);
    if (!response.ok) throw new Error(`Failed to load ${pagePath}: ${response.status}`);
    content.innerHTML = await response.text();
    await initializeComponents(content);

    document.dispatchEvent(new CustomEvent("dalimgari:page-loaded", { detail: { path: pagePath } }));
}

function bindRoutes() {
    document.addEventListener("click", (event) => {
        const link = event.target.closest("[data-route]");
        if (!link) return;
        const path = link.dataset.route;
        if (!pageFiles[path]) return;
        event.preventDefault();
        if (window.location.hash !== `#${path}`) {
            window.location.hash = path;
        } else {
            loadPage(path).catch((error) => showLoaderError(error.message));
        }
    });

    window.addEventListener("hashchange", () => {
        const path = window.location.hash.slice(1) || "content/home.html";
        loadPage(path).catch((error) => showLoaderError(error.message));
    });
}

async function initializeWebsite() {
    const app = document.getElementById("app");
    if (!app) throw new Error("Missing root element: #app");

    await loadStylesheet(globalStylesheet);
    await loadStylesheet(contextLayoutStylesheet);
    const loaded = await Promise.all(contextFiles.map(loadContextFile));

    const context = document.createElement("div");
    context.id = "context";
    const sections = new Map();

    for (const file of loaded) {
        const section = document.createElement("section");
        section.dataset.context = file.name;
        section.innerHTML = file.html;
        sections.set(file.name, section);
    }

    const layout = document.createElement("div");
    layout.className = "site-layout";
    layout.append(sections.get("sidebar"), sections.get("content"));
    context.append(sections.get("header"), layout);
    app.replaceChildren(context);

    bindRoutes();
    const initialPath = window.location.hash.slice(1) || "content/home.html";
    await loadPage(initialPath);
}

const priorityThreeModules = [
    "./content/create-account.html",
    "./content/forgot-password.html",
    "./content/login.html",
    "./content/profile.html"
];

function preloadPriorityThree() {
    return Promise.all(priorityThreeModules.map((path) => fetch(path).catch(() => null)));
}

initializeWebsite()
    .then(preloadPriorityThree)
    .catch((error) => showLoaderError(error.message));
