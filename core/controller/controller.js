// Global Controller

let currentDefinition = null;
const listeners = new Set();
const actionState = { busy: false, action: null };

function dispatch(action, payload = {}) {
  for (const listener of listeners) {
    try { listener(action, payload); } catch (error) { console.error(error); }
  }
}

function setDefinition(id) {
  const registry = window.Dalimgari?.registry?.definition || {};
  if (!id || !Object.prototype.hasOwnProperty.call(registry, id)) {
    dispatch("action-error", {
      action: "navigation",
      error: { message: "Unknown definition." }
    });
    return false;
  }
  if (currentDefinition === id) return true;
  currentDefinition = id;
  dispatch("definition-change", { id });
  return true;
}

function getDefinition() {
  return currentDefinition;
}

function subscribe(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setBusy(action) {
  actionState.busy = Boolean(action);
  actionState.action = action || null;
  dispatch("action-state-change", { ...actionState });
}

function isBusy() {
  return actionState.busy;
}

async function handleAction(action, payload = {}) {
  const auth = window.Dalimgari?.auth;

  if (action === "forgot-password") return setDefinition("reset-password");
  if (action === "create-account") return setDefinition("register");
  if (action === "back-login") return setDefinition("login");

  if (action === "profile") {
    if (!auth) return { error: { message: "Authentication service is unavailable." } };
    const session = await auth.getSession();
    if (session?.error) return session;
    return setDefinition(session?.data?.session ? "profile" : "login");
  }

  if (!auth) return { error: { message: "Authentication service is unavailable." } };

  if (isBusy()) return { error: { message: "Please wait for the current action to finish." } };

  let result;
  setBusy(action);

  try {
    if (action === "login") {
      result = await auth.login(payload.identifier || "", payload.password || "");
      if (!result?.error) setDefinition("home");
    } else if (action === "register") {
      result = await auth.register(payload.email || "", payload.password || "");
      if (!result?.error && result.data?.session) setDefinition("home");
    } else if (action === "reset-password") {
      result = await auth.resetPassword(payload.email || "");
    } else if (action === "logout") {
      result = await auth.logout();
      if (!result?.error) setDefinition("login");
    } else {
      result = { error: { message: `Unknown action: ${action}` } };
    }
    return result;
  } catch (error) {
    return { error: { message: error?.message || "An unexpected error occurred." } };
  } finally {
    setBusy(null);
  }
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.controller = {
  dispatch,
  setDefinition,
  getDefinition,
  subscribe,
  isBusy,
  handleAction
};
