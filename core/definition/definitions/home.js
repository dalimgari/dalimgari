const homeDefinition = {
  id: "home",
  type: "content",
  elements: [
    { type: "heading", level: 1, text: "Home" },
    { type: "output", name: "status", value: "You are signed in." },
    { type: "button", action: "logout", label: "Logout", size: "large" }
  ]
};
window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.definition?.register("home", homeDefinition);
