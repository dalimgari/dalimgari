// Global Registry

const registry = {
  context: {
    header: "core/context/header.html",
    sidebar: "core/context/sidebar.html",
    content: "core/context/content.html"
  },
  definition: {
    login: "core/definition/definitions/login.js",
    home: "core/definition/definitions/home.js",
    register: "core/definition/definitions/register.js",
    "reset-password": "core/definition/definitions/reset-password.js",
    profile: "core/definition/definitions/profile.js"
  }
};

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.registry = registry;
