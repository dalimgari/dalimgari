export async function initProfile(root){
    const page=root.querySelector("[data-page=profile]");
    if(!page)return;
    const tabs=[...page.querySelectorAll("[data-profile-tab]")];
    const panels=[...page.querySelectorAll("[data-profile-panel]")];
    const selectTab=(name)=>{
        tabs.forEach(tab=>{
            const active=tab.dataset.profileTab===name;
            tab.classList.toggle("is-active",active);
            tab.setAttribute("aria-selected",String(active));
        });
        panels.forEach(panel=>{
            const active=panel.dataset.profilePanel===name;
            panel.hidden=!active;
            panel.classList.toggle("is-active",active);
        });
    };
    tabs.forEach(tab=>tab.addEventListener("click",()=>selectTab(tab.dataset.profileTab)));
    page.querySelector("[data-profile-open-settings]")?.addEventListener("click",()=>selectTab("settings"));

    const access=window.dalimgariAccess;
    const ctx=await access?.getContext?.();
    const owner=!!ctx?.isAuthenticated;
    page.querySelectorAll("[data-requires-owner]").forEach(el=>{el.hidden=!owner;});
    if(!owner)return;

    const user=ctx.user||ctx.session?.user;
    if(user){
        const metadata=user.user_metadata||{};
        page.querySelector("[data-profile-username]")?.replaceChildren(document.createTextNode(metadata.username||user.email?.split("@")[0]||"—"));
        page.querySelector("[data-profile-email]")?.replaceChildren(document.createTextNode(user.email||"—"));
        page.querySelector("[data-profile-status]")?.replaceChildren(document.createTextNode(user.email_confirmed_at?"Active":"Pending"));
        page.querySelector("[data-profile-type]")?.replaceChildren(document.createTextNode(metadata.account_type||metadata.role||"Member"));
        page.querySelector("[data-profile-bio]")?.replaceChildren(document.createTextNode(metadata.bio||"—"));
        const usernameInput=page.querySelector("[data-profile-username-input]");
        const bioInput=page.querySelector("[data-profile-bio-input]");
        if(usernameInput)usernameInput.value=metadata.username||"";
        if(bioInput)bioInput.value=metadata.bio||"";
    }
    const form=page.querySelector("[data-profile-form]");
    form?.addEventListener("submit",async event=>{
        event.preventDefault();
        const message=page.querySelector("[data-auth-message]");
        const username=form.elements.username.value.trim();
        const bio=form.elements.bio.value.trim();
        const client=window.dalimgariSupabase;
        if(!client||!user){message.textContent="Profile service is unavailable.";return;}
        const {error}=await client.auth.updateUser({data:{...(user.user_metadata||{}),username,bio}});
        message.textContent=error?error.message:"Profile updated.";
        if(!error){
            page.querySelector("[data-profile-username]")?.replaceChildren(document.createTextNode(username||"—"));
            page.querySelector("[data-profile-bio]")?.replaceChildren(document.createTextNode(bio||"—"));
        }
    });
}