const supabaseClient = window.dalimgariSupabase;
const DEFAULT_AVATAR = "./component/avatar/default-avatar.svg";

export async function initAvatar(root = document) {
    const avatar = root.querySelector("[data-avatar]");
    if (!avatar || !supabaseClient) return;

    const { data } = await supabaseClient.auth.getSession();
    const session = data?.session;
    const image = avatar.querySelector(".avatar__image");
    image.src = DEFAULT_AVATAR;

    if (!session) {
        avatar.href = "#content/login.html";
        avatar.dataset.route = "content/login.html";
        avatar.setAttribute("aria-label", "Login");
        image.alt = "Default profile avatar";
        image.onerror = () => { image.src = DEFAULT_AVATAR; };
        return;
    }

    const user = session.user;
    let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
    const { data: profile } = await supabaseClient
        .from("User")
        .select("username,email,avatar_url,account_status,account_type")
        .eq("user_id", user.id)
        .maybeSingle();

    if (profile?.avatar_url) avatarUrl = profile.avatar_url;
    image.src = avatarUrl || DEFAULT_AVATAR;
    image.alt = profile?.username || user.email || "Profile";
    image.onerror = () => { image.src = DEFAULT_AVATAR; image.alt = "Default profile avatar"; };

    avatar.href = "#content/profile.html";
    avatar.dataset.route = "content/profile.html";
    avatar.setAttribute("aria-label", "Profile");
}