function createButton(definition) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.size = definition.size || "small";
  button.textContent = definition.label || "";

  if (definition.action) {
    button.addEventListener("click", () => {
      window.Dalimgari.controller?.dispatch(definition.action);
    });
  }

  return button;
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.components = window.Dalimgari.components || {};
window.Dalimgari.components.button = createButton;
