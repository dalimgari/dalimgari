const globalFeatures = [
  { name: "variables", selector: null, css: "style/variables.css" },
  { name: "reset", selector: null, css: "style/reset.css" },
  { name: "body", selector: null, css: "style/body.css" },
  { name: "font", selector: null, css: "style/font.css" },
  { name: "link", selector: null, css: "style/link.css" },
  { name: "image", selector: null, css: "style/image.css" },
  { name: "focus", selector: null, css: "style/focus.css" },
  { name: "spacing", selector: null, css: "style/spacing.css" },
  { name: "button", selector: "button", css: "style/button.css" },
  { name: "input-box", selector: "input, textarea, select", css: "style/input-box.css" },
  { name: "output-box", selector: "output", css: "style/output-box.css" },
  { name: "avatar", selector: '[data-context-slot="profile-avatar"]', css: "style/avatar.css", js: "component/avatar.js" },
  { name: "header", selector: '[data-context="header"]', css: "style/header.css", html: "context/header.html" },
  { name: "menu", selector: '[data-context-slot="menu"]', js: "component/menu.js" },
  { name: "sidebar", selector: '[data-context="sidebar"]', css: "style/sidebar.css", html: "context/sidebar.html", js: "component/sidebar.js" }
];

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.registry = globalFeatures;
