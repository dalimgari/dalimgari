const supabaseClient = window.dalimgariSupabase;
const DEFAULT_AVATAR_DAY = "./component/avatar/default-avatar-day.svg";
const DEFAULT_AVATAR_NIGHT = "./component/avatar/default-avatar-night.svg";

function getThemeMode(){
    const root=document.documentElement;
    const explicit=root.dataset.themeMode||root.dataset.theme||localStorage.getItem("dalimgari:theme")||localStorage.getItem("dalimgari:theme-mode")||"";
    if(explicit==="dark")return "dark";
    if(explicit==="light")return "light";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function defaultAvatarUrl(){return getThemeMode()==="dark"?DEFAULT_AVATAR_NIGHT:DEFAULT_AVATAR_DAY}
function setDefaultAvatar(image){
    if(!image)return;
    image.src=defaultAvatarUrl();
    image.alt="Default profile avatar";
}
export async function initAvatar(root = document) {
    const avatar = root.querySelector("[data-avatar]");
    if (!avatar || !supabaseClient) return;
    const image = avatar.querySelector(".avatar__image");
    setDefaultAvatar(image);
    const { data } = await supabaseClient.auth.getSession();
    const session = data?.session;
    if (!session) {
        avatar.href = "#content/login.html";
        avatar.dataset.route = "content/login.html";
        avatar.setAttribute("aria-label", "Sign in");
        image.onerror = () => setDefaultAvatar(image);
        return;
    }
    const user = session.user;
    let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
    const { data: profile } = await supabaseClient.from("User").select("username,email,avatar_url,account_status").eq("user_id", user.id).maybeSingle();
    if (profile?.avatar_url) avatarUrl = profile.avatar_url;
    image.src = avatarUrl || defaultAvatarUrl();
    image.alt = profile?.username || user.email || "Profile";
    image.onerror = () => setDefaultAvatar(image);
    avatar.href = "#content/profile.html";
    avatar.dataset.route = "content/profile.html";
    avatar.setAttribute("aria-label", "Profile");
}
export function refreshDefaultAvatarTheme(root=document){
    root.querySelectorAll("[data-avatar] .avatar__image").forEach(image=>{
        if(image.src.includes("default-avatar-")||!image.getAttribute("src")) setDefaultAvatar(image);
    });
}