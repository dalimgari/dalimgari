// Profile Avatar Component

const avatarSlot = document.querySelector('[data-context-slot="profile-avatar"]');

if (avatarSlot && !avatarSlot.querySelector('[data-component="profile-avatar"]')) {
  const avatar = document.createElement("a");
  avatar.dataset.component = "profile-avatar";
  avatar.href = "#login";
  avatar.setAttribute("aria-label", "প্রোফাইল");
  avatar.innerHTML = '<span aria-hidden="true"></span>';

  function updateTarget(session) {
    const signedIn = Boolean(session);
    avatar.href = signedIn ? "#profile" : "#login";
    avatar.setAttribute("aria-label", signedIn ? "প্রোফাইল" : "লগইন");
  }

  avatar.addEventListener("click", event => {
    event.preventDefault();
    window.Dalimgari.controller?.handleAction("profile");
  });

  window.Dalimgari.controller?.subscribe((action, payload) => {
    if (action === "auth-state-change") {
      updateTarget(payload.session);
    }
  });

  window.Dalimgari.auth?.getSession().then(({ data }) => {
    updateTarget(data.session);
  });

  avatarSlot.appendChild(avatar);
}
