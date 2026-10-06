const headerContent = document.querySelector(".site-header-content");
const menuButton = headerContent?.querySelector(".menu-button");

if (headerContent && menuButton && !headerContent.querySelector(".profile-avatar")) {
  const avatar = document.createElement("div");
  avatar.className = "profile-avatar";
  avatar.setAttribute("aria-label", "প্রোফাইল");
  avatar.setAttribute("role", "img");
  avatar.textContent = "P";

  menuButton.insertAdjacentElement("afterend", avatar);
}
