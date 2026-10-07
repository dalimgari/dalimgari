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
  const avatars = document.querySelectorAll("[data-avatar]");

  if (!avatars.length) {
    return;
  }

  const signedIn = Boolean(session);
  const path = signedIn ? "content/profile.html" : "content/login.html";

  avatars.forEach((avatar) => {
    avatar.href = `#${path}`;
    avatar.dataset.route = path;
    avatar.setAttribute("aria-label", signedIn ? "Profile" : "Login");
  });
}

async function refreshAuthUI() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Auth session lookup failed:", error);
    return;
  }

  updateAuthUI(data.session);
}

async function handleLogin(form) {
  const identifier = form.elements.identifier.value.trim();
  const password = form.elements.password.value;

  const credentials = identifier.includes("@")
    ? { email: identifier, password }
    : { phone: identifier, password };

  const { error } = await supabaseClient.auth.signInWithPassword(credentials);

  if (error) {
    authMessage(form, error.message);
    return;
  }

  authMessage(form, "Login successful.");
  goToContent("content/home.html");
}

async function handleSignup(form) {
  const name = form.elements.name.value.trim();
  const identifier = form.elements.identifier.value.trim();
  const password = form.elements.password.value;
  const confirmPassword = form.elements["confirm-password"].value;

  if (password !== confirmPassword) {
    authMessage(form, "Passwords do not match.");
    return;
  }

  const isEmail = identifier.includes("@");
  const credentials = isEmail
    ? { email: identifier, password }
    : { phone: identifier, password };

  const { data, error } = await supabaseClient.auth.signUp({
    ...credentials,
    options: {
      data: { name }
    }
  });

  if (error) {
    authMessage(form, error.message);
    return;
  }

  if (data.session) {
    authMessage(form, "Account created successfully.");
    goToContent("content/home.html");
    return;
  }

  authMessage(
    form,
    isEmail
      ? "Account created. Check your email to confirm your account."
      : "Account created. Check your phone for the verification code."
  );
}

async function handlePasswordResetRequest(form) {
  const email = form.elements.email.value.trim();

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: getAppBaseUrl() + "#content/forgot-password.html"
  });

  if (error) {
    authMessage(form, error.message);
    return;
  }

  authMessage(form, "Password reset link sent. Check your email.");
}

async function handlePasswordUpdate(form) {
  const password = form.elements["reset-password"].value;

  if (!password) {
    authMessage(form, "Enter a new password.");
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password });

  if (error) {
    authMessage(form, error.message);
    return;
  }

  authMessage(form, "Password updated successfully.");
  goToContent("content/login.html");
}

async function handleGoogleLogin(button) {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAppBaseUrl() + "#content/home.html"
    }
  });

  if (error) {
    const form = button.closest("form");

    if (form) {
      authMessage(form, error.message);
    }
  }
}

async function handleLogout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error(error);
    return;
  }

  goToContent("content/home.html");
}

document.addEventListener("submit", (event) => {
  const form = event.target;

  if (form.matches('[data-auth-form="login"]')) {
    event.preventDefault();
    handleLogin(form).catch(console.error);
  }

  if (form.matches('[data-auth-form="signup"]')) {
    event.preventDefault();
    handleSignup(form).catch(console.error);
  }

  if (form.matches('[data-auth-form="password-reset-request"]')) {
    event.preventDefault();
    handlePasswordResetRequest(form).catch(console.error);
  }

  if (form.matches('[data-auth-form="password-update"]')) {
    event.preventDefault();
    handlePasswordUpdate(form).catch(console.error);
  }
});

document.addEventListener("click", (event) => {
  const googleButton = event.target.closest("[data-auth-action='google']");
  const logoutButton = event.target.closest("[data-auth-action='logout']");

  if (googleButton) {
    event.preventDefault();
    handleGoogleLogin(googleButton).catch(console.error);
  }

  if (logoutButton) {
    event.preventDefault();
    handleLogout().catch(console.error);
  }
});

document.addEventListener("dalimgari:page-loaded", () => {
  refreshAuthUI().catch(console.error);
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  updateAuthUI(session);
});

refreshAuthUI().catch(console.error);
