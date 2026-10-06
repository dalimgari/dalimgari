const menuBase = new URL("../menu/", document.currentScript.src);

const menuStyle = document.createElement("link");
menuStyle.rel = "stylesheet";
menuStyle.href = new URL("menu.css", menuBase);
document.head.appendChild(menuStyle);

const menuScript = document.createElement("script");
menuScript.src = new URL("menu.js", menuBase);
document.body.appendChild(menuScript);
