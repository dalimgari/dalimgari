const buttonBase = new URL("../button/", document.currentScript.src);

const buttonStyle = document.createElement("link");
buttonStyle.rel = "stylesheet";
buttonStyle.href = new URL("button.css", buttonBase);
document.head.appendChild(buttonStyle);

const menuBase = new URL("../menu/", document.currentScript.src);

const menuStyle = document.createElement("link");
menuStyle.rel = "stylesheet";
menuStyle.href = new URL("menu.css", menuBase);
document.head.appendChild(menuStyle);

const menuScript = document.createElement("script");
menuScript.src = new URL("menu.js", menuBase);
document.body.appendChild(menuScript);

const profileAvatarBase = new URL("../profile-avatar/", document.currentScript.src);

const profileAvatarStyle = document.createElement("link");
profileAvatarStyle.rel = "stylesheet";
profileAvatarStyle.href = new URL("profile-avatar.css", profileAvatarBase);
document.head.appendChild(profileAvatarStyle);

const profileAvatarScript = document.createElement("script");
profileAvatarScript.src = new URL("profile-avatar.js", profileAvatarBase);
document.body.appendChild(profileAvatarScript);
