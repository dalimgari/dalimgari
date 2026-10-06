const avatarSlot = document.querySelector('[data-context-slot="profile-avatar"]');

if (avatarSlot && !avatarSlot.querySelector('[data-component="profile-avatar"]')) {
  const avatar = document.createElement("a");
  avatar.dataset.component = "profile-avatar";
  avatar.href = "#login";
  avatar.setAttribute("aria-label", "প্রোফাইল");
  avatar.innerHTML = '<span aria-hidden="true"></span>';

  avatar.addEventListener("click", event => {
    event.preventDefault();
    window.Dalimgari.controller?.setDefinition("login");
  });

  avatarSlot.appendChild(avatar);
}
