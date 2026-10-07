const supabaseClient = window.dalimgariSupabase;

export async function initAvatar(root = document) {
    const avatar = root.querySelector("[data-avatar]");
    if (!avatar || !supabaseClient) return;

    const { data } = await supabaseClient.auth.getSession();
    const session = data?.session;

    if (!session) {
        avatar.href = "#content/login.html";
        avatar.dataset.route = "content/login.html";
        avatar.setAttribute("aria-label", "Login");
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
    if (avatarUrl) {
        const image = avatar.querySelector(".avatar__image");
        image.src = avatarUrl;
        image.alt = profile?.username || user.email || "Profile";
        image.hidden = false;
        avatar.querySelector(".avatar__fallback").hidden = true;
    }

    avatar.href = "#content/profile.html";
    avatar.dataset.route = "content/profile.html";
    avatar.setAttribute("aria-label", "Profile");
}