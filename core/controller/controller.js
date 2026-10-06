// Global Controller

let currentDefinition = null;
const listeners = new Set();

function dispatch(action, payload = {}) {
  for (const listener of listeners) {
    try { listener(action, payload); } catch (error) { console.error(error); }
  }
}

function setDefinition(id) {
  if (!id || currentDefinition === id) return;
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

async function handleAction(action, payload = {}) {
  const auth = window.Dalimgari?.auth;

  if (action === "forgot-password") return setDefinition("reset-password");
  if (action === "create-account") return setDefinition("register");
  if (action === "back-login") return setDefinition("login");
  if (action === "profile") {
    const session = await auth?.getSession();
    if (session?.data?.session) return setDefinition("profile");
    return setDefinition("login");
  }

  if (!auth) return { error: { message: "Authentication service is unavailable." } };

  let result;

  if (action === "login") {
    result = await auth.login(payload.identifier || "", payload.password || "");
    if (!result?.error) setDefinition("home");
    return result;
  }

  if (action === "register") {
    result = await auth.register(payload.email || "", payload.password || "");
    if (!result?.error && result.data?.session) setDefinition("home");
    return result;
  }

  if (action === "reset-password") {
    return auth.resetPassword(payload.email || "");
  }

  if (action === "logout") {
    result = await auth.logout();
    if (!result?.error) setDefinition("login");
    return result;
  }

  return { error: { message: `Unknown action: ${action}` } };
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.controller = {
  dispatch,
  setDefinition,
  getDefinition,
  subscribe,
  handleAction
};
