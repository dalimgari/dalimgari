const avatarSlot = document.querySelector('[data-context-slot="profile-avatar"]');

if (avatarSlot && !avatarSlot.querySelector(".profile-avatar")) {
  const avatar = document.createElement("a");
  avatar.className = "profile-avatar";
  avatar.href = "/dalimgari/login.html";
  avatar.setAttribute("aria-label", "প্রোফাইল");
  avatar.innerHTML = '<span class="profile-avatar-icon" aria-hidden="true"></span>';

  avatarSlot.appendChild(avatar);
}
