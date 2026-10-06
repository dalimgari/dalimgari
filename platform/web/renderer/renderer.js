// Web Renderer

function clearElement(element) {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function renderElement(definition) {
  const components = window.Dalimgari.components || {};

  if (definition.type === "input" && components.input) {
    return components.input(definition);
  }

  if (definition.type === "button" && components.button) {
    return components.button(definition);
  }

  if (definition.type === "actions") {
    const wrapper = document.createElement("div");
    for (const item of definition.items || []) {
      const element = renderElement(item);
      if (element) wrapper.appendChild(element);
    }
    return wrapper;
  }

  return null;
}

async function renderDefinition(id) {
  const definition = await window.Dalimgari.webAdapter.loadDefinition(id);
  const content = document.querySelector('[data-context="content"]');
  if (!content) return;

  clearElement(content);

  if (definition.type === "content") {
    const form = document.createElement("form");
    form.dataset.definition = definition.id;
    form.addEventListener("submit", event => event.preventDefault());

    for (const elementDefinition of definition.elements || []) {
      const element = renderElement(elementDefinition);
      if (element) form.appendChild(element);
    }

    content.appendChild(form);
  }
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.webRenderer = {
  renderDefinition
};
