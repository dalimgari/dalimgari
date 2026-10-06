// Web Renderer

function clearElement(element) {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function renderElement(definition) {
  const components = window.Dalimgari.components || {};

  if (definition.type === "input" && components.input) return components.input(definition);
  if (definition.type === "button" && components.button) return components.button(definition);
  if (definition.type === "output" && components.output) return components.output(definition);

  if (definition.type === "heading") {
    const level = Math.min(6, Math.max(1, Number(definition.level) || 1));
    const heading = document.createElement(`h${level}`);
    heading.textContent = definition.text || "";
    return heading;
  }

  if (definition.type === "actions") {
    const wrapper = document.createElement("div");
    wrapper.dataset.element = "actions";
    for (const item of definition.items || []) {
      const element = renderElement(item);
      if (element) wrapper.appendChild(element);
    }
    return wrapper;
  }

  return null;
}

async function renderDefinition(id) {
  try {
    const definition = await window.Dalimgari.webAdapter.loadDefinition(id);
    const content = document.querySelector('[data-context="content"]');
    if (!content) return;
    clearElement(content);

    if (definition.type !== "content") return;
    const form = document.createElement("form");
    form.dataset.definition = definition.id;
    form.addEventListener("submit", event => event.preventDefault());

    for (const item of definition.elements || []) {
      const element = renderElement(item);
      if (element) form.appendChild(element);
    }
    content.appendChild(form);
  } catch (error) {
    console.error("Dalimgari render error:", error);
  }
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.webRenderer = { renderDefinition };
