// Authentication Controller

async function login(identifier, password) {
  const client = window.Dalimgari.supabase;
  if (!client) return { error: { message: "Authentication service is unavailable." } };
  const credentials = identifier.includes("@") ? { email: identifier, password } : { phone: identifier, password };
  const result = await client.auth.signInWithPassword(credentials);
  if (!result.error) window.Dalimgari.controller.setDefinition("home");
  return result;
}

async function register(email, password) {
  const client = window.Dalimgari.supabase;
  if (!client) return { error: { message: "Authentication service is unavailable." } };
  const result = await client.auth.signUp({ email, password });
  if (!result.error && result.data.session) window.Dalimgari.controller.setDefinition("home");
  return result;
}

async function resetPassword(email) {
  const client = window.Dalimgari.supabase;
  if (!client) return { error: { message: "Authentication service is unavailable." } };
  return client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
}

async function logout() {
  const client = window.Dalimgari.supabase;
  if (!client) return { error: { message: "Authentication service is unavailable." } };
  const result = await client.auth.signOut();
  if (!result.error) window.Dalimgari.controller.setDefinition("login");
  return result;
}

async function initializeAuth() {
  const client = window.Dalimgari.supabase;
  if (!client) return;
  client.auth.onAuthStateChange((_event, session) => window.Dalimgari.controller.dispatch("auth-state-change", { session }));
  const { data } = await client.auth.getSession();
  window.Dalimgari.controller.dispatch("auth-state-change", { session: data.session });
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.auth = { login, register, resetPassword, logout, initialize: initializeAuth };
