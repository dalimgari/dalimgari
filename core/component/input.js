function createInput(definition) {
  const input = document.createElement("input");
  input.name = definition.name || "";
  input.type = definition.inputType || "text";
  input.placeholder = definition.placeholder || "";
  if (definition.autocomplete) input.autocomplete = definition.autocomplete;
  return input;
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.components = window.Dalimgari.components || {};
window.Dalimgari.components.input = createInput;
