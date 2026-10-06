// Global Controller

let currentDefinition = null;
const listeners = new Set();

function dispatch(action, payload = {}) {
  for (const listener of listeners) {
    try { listener(action, payload); } catch (error) { console.error(error); }
  }
}

function setDefinition(id) {
  currentDefinition = id;
  dispatch("definition-change", { id });
}

function getDefinition() { return currentDefinition; }

function subscribe(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function handleAction(action, payload = {}) {
  const auth = window.Dalimgari?.auth;
  if (!auth) return;

  if (action === "login") return auth.login(payload.identifier, payload.password);
  if (action === "register") return auth.register(payload.email, payload.password);
  if (action === "reset-password") return auth.resetPassword(payload.email);
  if (action === "logout") return auth.logout();
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.controller = { dispatch, setDefinition, getDefinition, subscribe, handleAction };
