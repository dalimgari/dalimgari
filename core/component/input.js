function createInput(definition) {
  const input = document.createElement(definition.multiline ? "textarea" : "input");
  input.name = definition.name || "";
  if (!definition.multiline) input.type = definition.inputType || "text";
  input.placeholder = definition.placeholder || "";
  input.required = Boolean(definition.required);
  if (definition.minLength) input.minLength = Number(definition.minLength);
  if (definition.maxLength) input.maxLength = Number(definition.maxLength);
  if (definition.pattern && !definition.multiline) input.pattern = definition.pattern;
  if (definition.autocomplete && !definition.multiline) input.autocomplete = definition.autocomplete;
  return input;
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.components = window.Dalimgari.components || {};
window.Dalimgari.components.input = createInput;
