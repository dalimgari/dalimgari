const loginDefinition = {
  id: "login",
  type: "content",
  elements: [
    {
      type: "input",
      name: "identifier",
      inputType: "text",
      placeholder: "Email / Phone Number",
      autocomplete: "username"
    },
    {
      type: "input",
      name: "password",
      inputType: "password",
      placeholder: "Password",
      autocomplete: "current-password"
    },
    {
      type: "button",
      name: "login",
      action: "login",
      label: "Login",
      size: "large"
    },
    {
      type: "actions",
      items: [
        { type: "button", action: "forgot-password", label: "Forgot Password", size: "small" },
        { type: "button", action: "create-account", label: "Create Account", size: "small" }
      ]
    }
  ]
};

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.definition?.register("login", loginDefinition);
