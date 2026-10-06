const globalFeatures = [
  { name: "variables", selector: null, css: "style/global/variables/variables.css" },
  { name: "reset", selector: null, css: "style/global/reset/reset.css" },
  { name: "body", selector: null, css: "style/global/body/body.css" },
  { name: "font", selector: null, css: "style/global/font/font.css" },
  { name: "link", selector: null, css: "style/global/link/link.css" },
  { name: "image", selector: null, css: "style/global/image/image.css" },
  { name: "focus", selector: null, css: "style/global/focus/focus.css" },
  { name: "spacing", selector: null, css: "style/global/spacing/spacing.css" },
  { name: "button", selector: "button", css: "style/component/button.css" },
  { name: "input-box", selector: "input, textarea, select", css: "style/component/input-box.css" },
  { name: "output-box", selector: "output", css: "style/component/output-box.css" },
  { name: "avatar", selector: '[data-component="profile-avatar"]', css: "style/component/avatar.css", js: "component/avatar/avatar.js" },
  { name: "header", selector: '[data-context="header"]', css: "style/context/header.css", contextCss: "context/header/header.css", html: "context/header/header.html" },
  { name: "menu", selector: '[data-context-slot="menu"]', js: "component/menu/menu.js" },
  { name: "sidebar", selector: '[data-context="sidebar"]', css: "style/context/sidebar.css", contextCss: "context/sidebar/sidebar.css", html: "context/sidebar/sidebar.html", js: "component/sidebar/sidebar.js" }
];

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.registry = globalFeatures;