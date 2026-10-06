const globalFeatures = [
  { name: "variables", selector: null, css: "global-style/variables/variables.css" },
  { name: "reset", selector: null, css: "global-style/reset/reset.css" },
  { name: "body", selector: null, css: "global-style/body/body.css" },
  { name: "font", selector: null, css: "global-style/font/font.css" },
  { name: "link", selector: null, css: "global-style/link/link.css" },
  { name: "image", selector: null, css: "global-style/image/image.css" },
  { name: "focus", selector: null, css: "global-style/focus/focus.css" },
  { name: "spacing", selector: null, css: "global-style/spacing/spacing.css" },
  { name: "button", selector: "button", css: "button/button.css" },
  { name: "input-box", selector: "input, textarea, select", css: "input-box/input-box.css" },
  { name: "output-box", selector: "output", css: "output-box/output-box.css" },
  { name: "avatar", selector: '[data-component="profile-avatar"]', css: "avatar/avatar.css", js: "avatar/avatar.js" },
  { name: "header", selector: '[data-context="header"]', css: "header/header.css", html: "header/header.html", js: "header/header.js" },
  { name: "menu", selector: '[data-context-slot="menu"]', js: "menu/menu.js" },
  { name: "sidebar", selector: '[data-context="sidebar"]', css: "sidebar/sidebar.css", html: "sidebar/sidebar.html", js: "sidebar/sidebar.js" }
];