// Authentication Controller

function authError(message) {
  return { error: { message } };
}

function getClient() {
  return window.Dalimgari?.supabase || null;
}

async function login(identifier, password) {
  const client = getClient();
  if (!client) return authError("Authentication service is unavailable.");
  if (!identifier || !password) return authError("Email / phone and password are required.");

  const credentials = identifier.includes("@")
    ? { email: identifier, password }
    : { phone: identifier, password };

  return client.auth.signInWithPassword(credentials);
}

async function register(email, password) {
  const client = getClient();
  if (!client) return authError("Authentication service is unavailable.");
  if (!email || !password) return authError("Email and password are required.");

  return client.auth.signUp({ email, password });
}

async function resetPassword(email) {
  const client = getClient();
  if (!client) return authError("Authentication service is unavailable.");
  if (!email) return authError("Email is required.");

  return client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
}

async function getSession() {
  const client = getClient();
  if (!client) return authError("Authentication service is unavailable.");
  return client.auth.getSession();
}

async function logout() {
  const client = getClient();
  if (!client) return authError("Authentication service is unavailable.");

  return client.auth.signOut();
}

async function initializeAuth() {
  const client = getClient();
  if (!client) return;

  client.auth.onAuthStateChange((_event, session) => {
    window.Dalimgari.controller?.dispatch("auth-state-change", { session });
  });

  const { data, error } = await getSession();

  if (error) {
    window.Dalimgari.controller?.dispatch("auth-state-change", {
      session: null,
      error
    });
    return;
  }

  window.Dalimgari.controller?.dispatch("auth-state-change", {
    session: data.session
  });
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.auth = {
  login,
  register,
  resetPassword,
  logout,
  getSession,
  initialize: initializeAuth
};
