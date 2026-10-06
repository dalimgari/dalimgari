function createButton(definition) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.size = definition.size || "small";
  button.textContent = definition.label || "";

  if (definition.action) {
    button.addEventListener("click", async () => {
      const form = button.closest("form");
      const payload = {};
      if (form) {
        for (const field of form.querySelectorAll("input[name], textarea[name], select[name]")) {
          payload[field.name] = field.value;
        }
      }
      const result = await window.Dalimgari.controller?.handleAction(definition.action, payload);
      if (result?.error) window.Dalimgari.controller?.dispatch("action-error", { action: definition.action, error: result.error });
      else window.Dalimgari.controller?.dispatch("action-success", { action: definition.action, result });
    });
  }

  return button;
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.components = window.Dalimgari.components || {};
window.Dalimgari.components.button = createButton;
