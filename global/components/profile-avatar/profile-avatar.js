const headerContent = document.querySelector(".site-header-content");
const menuButton = headerContent?.querySelector(".menu-button");

if (headerContent && menuButton && !headerContent.querySelector(".profile-avatar")) {
  const avatar = document.createElement("a");
  avatar.className = "profile-avatar";
  avatar.href = "/dalimgari/login.html";
  avatar.setAttribute("aria-label", "প্রোফাইল");
  avatar.innerHTML = '<span class="profile-avatar-icon" aria-hidden="true"></span>';

  menuButton.insertAdjacentElement("beforebegin", avatar);
}
