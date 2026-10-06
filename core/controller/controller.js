// Global Controller

let currentDefinition = null;
const listeners = new Set();

function dispatch(action, payload = {}) {
  for (const listener of listeners) {
    listener(action, payload);
  }
}

function setDefinition(id) {
  currentDefinition = id;
  dispatch("definition-change", { id });
}

function getDefinition() {
  return currentDefinition;
}

function subscribe(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.controller = {
  dispatch,
  setDefinition,
  getDefinition,
  subscribe
};
