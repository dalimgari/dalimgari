// Global Definition

const definitions = {};

function registerDefinition(id, value) {
  if (!id || !value) return;
  definitions[id] = value;
}

function getDefinition(id) {
  return definitions[id] || null;
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.definition = {
  register: registerDefinition,
  get: getDefinition,
  all: definitions
};
