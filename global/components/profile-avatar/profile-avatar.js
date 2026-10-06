const headerContent = document.querySelector(".site-header-content");
const menuButton = headerContent?.querySelector(".menu-button");

if (headerContent && menuButton && !headerContent.querySelector(".profile-avatar")) {
  const avatar = document.createElement("button");
  avatar.className = "profile-avatar";
  avatar.type = "button";
  avatar.setAttribute("aria-label", "প্রোফাইল");
  avatar.textContent = "P";

  avatar.addEventListener("click", () => {
    window.location.href = "/dalimgari/login.html";
  });

  menuButton.insertAdjacentElement("afterend", avatar);
}
