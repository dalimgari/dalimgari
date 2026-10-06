const resetPasswordDefinition = {
  id: "reset-password",
  type: "content",
  elements: [
    { type: "input", name: "email", inputType: "email", placeholder: "Email", autocomplete: "email" },
    { type: "button", action: "reset-password", label: "Reset Password", size: "large" },
    { type: "button", action: "back-login", label: "Back to Login", size: "small" }
  ]
};
window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.definition?.register("reset-password", resetPasswordDefinition);
