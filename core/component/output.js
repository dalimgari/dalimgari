function createOutput(definition) {
  const output = document.createElement("output");
  output.name = definition.name || "";
  output.textContent = definition.value || "";
  if (definition.role) output.setAttribute("role", definition.role);
  return output;
}
window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.components = window.Dalimgari.components || {};
window.Dalimgari.components.output = createOutput;
