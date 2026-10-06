const avatarSlot = document.querySelector('[data-context-slot="profile-avatar"]');

if (avatarSlot && !avatarSlot.querySelector('[data-component="profile-avatar"]')) {
  const avatar = document.createElement("a");
  avatar.dataset.component = "profile-avatar";
  avatar.href = "/dalimgari/login.html";
  avatar.setAttribute("aria-label", "প্রোফাইল");
  avatar.innerHTML = '<span aria-hidden="true"></span>';

  avatarSlot.appendChild(avatar);
}
