const profileDefinition = {
  id: "profile",
  type: "content",
  elements: [
    { type: "heading", level: 1, text: "Profile" },
    { type: "output", name: "email", value: "" },
    { type: "button", action: "logout", label: "Logout", size: "large" }
  ]
};
window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.definition?.register("profile", profileDefinition);
