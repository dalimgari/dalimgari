const supabaseClient = window.dalimgariSupabase;

function authMessage(form, message) {
  let output = form.querySelector("[data-auth-message]");
  if (!output) {
    output = document.createElement("output");
    output.dataset.authMessage = "";
    form.appendChild(output);
  }
  output.textContent = message;
}

function getAppBaseUrl() {
  return new URL("./", window.location.href).href;
}

function goToContent(path) {
  if (window.location.hash === `#${path}`) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = path;
}

function updateAuthUI(session) {
  document.querySelectorAll("[data-avatar]").forEach((avatar) => {
    const signedIn = Boolean(session);
    const path = signedIn ? "content/profile.html" : "content/login.html";
    avatar.href = `#${path}`;
    avatar.dataset.route = path;
    avatar.setAttribute("aria-label", signedIn ? "Profile" : "Login");
  });
}

async function getSession() {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function loadProfile(session) {
  if (!session || !supabaseClient) return null;
  const { data, error } = await supabaseClient
    .from("User")
    .select("username,email,avatar_url,account_status,account_type")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function refreshAuthUI() {
  try {
    const session = await getSession();
    updateAuthUI(session);
    const page = document.querySelector('[data-page="profile"]');
    if (page && session) {
      const profile = await loadProfile(session);
      page.querySelector("[data-profile-username]").textContent = profile?.username || session.user.user_metadata?.name || "—";
      page.querySelector("[data-profile-email]").textContent = profile?.email || session.user.email || "—";
      page.querySelector("[data-profile-status]").textContent = profile?.account_status || "active";
      page.querySelector("[data-profile-type]").textContent = profile?.account_type || "member";
    }
  } catch (error) {
    console.error("Auth UI refresh failed:", error);
  }
}

async function handleLogin(form) {
  const identifier = form.elements.identifier.value.trim();
  const password = form.elements.password.value;
  const credentials = identifier.includes("@") ? { email: identifier, password } : { phone: identifier, password };
  const { error } = await supabaseClient.auth.signInWithPassword(credentials);
  if (error) return authMessage(form, error.message);
  authMessage(form, "Login successful.");
  goToContent("content/home.html");
}

async function handleSignup(form) {
  const name = form.elements.name.value.trim();
  const identifier = form.elements.identifier.value.trim();
  const password = form.elements.password.value;
  const confirmPassword = form.elements["confirm-password"].value;
  if (password !== confirmPassword) return authMessage(form, "Passwords do not match.");
  const isEmail = identifier.includes("@");
  const credentials = isEmail ? { email: identifier, password } : { phone: identifier, password };
  const { data, error } = await supabaseClient.auth.signUp({ ...credentials, options: { data: { name } } });
  if (error) return authMessage(form, error.message);
  if (data.session) {
    authMessage(form, "Account created successfully.");
    goToContent("content/home.html");
    return;
  }
  authMessage(form, isEmail ? "Account created. Check your email to confirm your account." : "Account created. Check your phone for the verification code.");
}

async function handlePasswordResetRequest(form) {
  const email = form.elements.email.value.trim();
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: getAppBaseUrl() + "#content/forgot-password.html"
  });
  if (error) return authMessage(form, error.message);
  authMessage(form, "Password reset link sent. Check your email.");
}

async function handlePasswordUpdate(form) {
  const session = await getSession();
  if (!session) return authMessage(form, "Open this page from the password reset link.");
  const password = form.elements["reset-password"].value;
  if (password.length < 8) return authMessage(form, "Password must be at least 8 characters.");
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) return authMessage(form, error.message);
  authMessage(form, "Password updated successfully.");
  setTimeout(() => goToContent("content/login.html"), 500);
}

async function updateRecoveryUI() {
  const requestForm = document.querySelector('[data-auth-form="password-reset-request"]');
  const updateForm = document.querySelector('[data-auth-form="password-update"]');
  const status = document.querySelector("[data-recovery-status]");
  if (!requestForm || !updateForm) return;
  const session = await getSession();
  const recovery = Boolean(session);
  requestForm.hidden = recovery;
  updateForm.hidden = !recovery;
  if (status) status.textContent = recovery ? "Choose a new password for your account." : "Enter your email to receive a reset link.";
}

async function handleGoogleLogin(button) {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getAppBaseUrl() + "#content/home.html" }
  });
  if (error) {
    const form = button.closest("form");
    if (form) authMessage(form, error.message);
  }
}

async function handleLogout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error("Logout failed:", error);
    return;
  }
  goToContent("content/home.html");
}

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (form.matches('[data-auth-form="login"]')) {
    event.preventDefault();
    handleLogin(form).catch((error) => authMessage(form, error.message));
  }
  if (form.matches('[data-auth-form="signup"]')) {
    event.preventDefault();
    handleSignup(form).catch((error) => authMessage(form, error.message));
  }
  if (form.matches('[data-auth-form="password-reset-request"]')) {
    event.preventDefault();
    handlePasswordResetRequest(form).catch((error) => authMessage(form, error.message));
  }
  if (form.matches('[data-auth-form="password-update"]')) {
    event.preventDefault();
    handlePasswordUpdate(form).catch((error) => authMessage(form, error.message));
  }
});

document.addEventListener("click", (event) => {
  const googleButton = event.target.closest("[data-auth-action='google']");
  const logoutButton = event.target.closest("[data-auth-action='logout']");
  if (googleButton) {
    event.preventDefault();
    handleGoogleLogin(googleButton).catch((error) => console.error("Google login failed:", error));
  }
  if (logoutButton) {
    event.preventDefault();
    handleLogout().catch((error) => console.error("Logout failed:", error));
  }
});

document.addEventListener("dalimgari:page-loaded", () => {
  refreshAuthUI();
  updateRecoveryUI().catch((error) => console.error("Recovery UI update failed:", error));
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  updateAuthUI(session);
  if (_event === "PASSWORD_RECOVERY" || _event === "SIGNED_IN" || _event === "SIGNED_OUT") {
    updateRecoveryUI().catch((error) => console.error("Recovery state update failed:", error));
  }
});

window.dalimgariAuth = { getSession, loadProfile };

refreshAuthUI();
