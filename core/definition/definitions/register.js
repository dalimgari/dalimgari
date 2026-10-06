const registerDefinition = {
  id: "register",
  type: "content",
  elements: [
    { type: "input", name: "email", inputType: "email", placeholder: "Email", autocomplete: "email", required: true },
    { type: "input", name: "password", inputType: "password", placeholder: "Password", autocomplete: "new-password", required: true },
    { type: "button", action: "register", label: "Create Account", size: "large" },
    { type: "button", action: "back-login", label: "Back to Login", size: "small" }
  ]
};
window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.definition?.register("register", registerDefinition);
