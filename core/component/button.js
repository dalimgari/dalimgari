function createButton(definition) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.size = definition.size || "small";
  button.textContent = definition.label || "";
  if (definition.action) {
    button.addEventListener("click", async () => {
      const controller = window.Dalimgari.controller;
      if (!controller || controller.isBusy()) return;

      const form = button.closest("form");
      if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const payload = {};
      if (form) {
        for (const field of form.querySelectorAll("input[name], textarea[name], select[name]")) {
          payload[field.name] = field.value;
        }
      }

      button.disabled = true;
      try {
        const result = await controller.handleAction(definition.action, payload);
        if (result?.error) {
          controller.dispatch("action-error", {
            action: definition.action,
            error: result.error
          });
        } else {
          controller.dispatch("action-success", {
            action: definition.action,
            result
          });
        }
      } finally {
        button.disabled = false;
      }
    });
  }
  return button;
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.components = window.Dalimgari.components || {};
window.Dalimgari.components.button = createButton;
