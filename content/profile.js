function getProfileTabController(page){
    if(page._profileTabController)return page._profileTabController;
    const tabs=[...page.querySelectorAll("[data-profile-tab]")];
    const primaryPanels=[...page.querySelectorAll("[data-profile-primary-panel]")];
    const secondaryPanels=[...page.querySelectorAll("[data-profile-secondary-panel]")];
    if(!tabs.length||!primaryPanels.length||!secondaryPanels.length)return null;
    const selectable=()=>tabs.filter(tab=>!tab.hidden);
    const selectTab=(name,focus=false)=>{
        const available=selectable();
        const target=available.find(tab=>tab.dataset.profileTab===name)||available.find(tab=>tab.dataset.profileTab==="overview")||available[0];
        if(!target)return;
        const activeName=target.dataset.profileTab;
        tabs.forEach(tab=>{
            const active=tab===target;
            tab.classList.toggle("is-active",active);
            tab.setAttribute("aria-selected",String(active));
            tab.setAttribute("tabindex",active?"0":"-1");
        });
        primaryPanels.forEach(panel=>{
            const active=panel.dataset.profilePrimaryPanel===activeName;
            panel.hidden=!active;
            panel.classList.toggle("is-active",active);
        });
        secondaryPanels.forEach(panel=>{
            const active=panel.dataset.profileSecondaryPanel===activeName;
            panel.hidden=!active;
            panel.classList.toggle("is-active",active);
        });
        page.dataset.profileActiveTab=activeName;
        if(focus)target.focus({preventScroll:true});
    };
    const onClick=event=>{
        const tab=event.target.closest?.("[data-profile-tab]");
        if(tab&&page.contains(tab)&&!tab.hidden)selectTab(tab.dataset.profileTab);
    };
    const onKeydown=event=>{
        const tab=event.target.closest?.("[data-profile-tab]");
        if(!tab||!page.contains(tab)||tab.hidden)return;
        if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
        event.preventDefault();
        const available=selectable();
        const index=available.indexOf(tab);
        const next=event.key==="Home"?0:event.key==="End"?available.length-1:(index+(event.key==="ArrowRight"?1:-1)+available.length)%available.length;
        selectTab(available[next]?.dataset.profileTab,true);
    };
    page.addEventListener("click",onClick);
    page.addEventListener("keydown",onKeydown);
    page._profileTabController={selectTab,refresh:()=>selectTab(page.dataset.profileActiveTab||"overview")};
    return page._profileTabController;
}
function bindProfileTabs(root=document){
    const page=root.matches?.("[data-page=profile]")?root:root.querySelector?.("[data-page=profile]");
    if(!page)return null;
    return getProfileTabController(page);
}
export async function initProfile(root){
    const page=root.querySelector("[data-page=profile]");
    if(!page)return;
    const controller=bindProfileTabs(page);
    const access=window.dalimgariAccess;
    const ctx=await access?.getContext?.();
    const owner=!!ctx?.isAuthenticated;
    page.querySelectorAll("[data-requires-owner]").forEach(el=>{el.hidden=!owner;});
    controller?.refresh();
    const user=ctx?.user||ctx?.session?.user;
    if(!user)return;
    const metadata=user.user_metadata||{};
    page.querySelector("[data-profile-name]")?.replaceChildren(document.createTextNode(metadata.full_name||metadata.name||user.email?.split("@")[0]||"Profile"));
    page.querySelector("[data-profile-email]")?.replaceChildren(document.createTextNode(user.email||"—"));
    page.querySelector("[data-profile-status]")?.replaceChildren(document.createTextNode(user.email_confirmed_at?"Active":"Pending"));
    page.querySelector("[data-profile-account-status]")?.replaceChildren(document.createTextNode(user.email_confirmed_at?"Active":"Pending"));
    const client=window.dalimgariSupabase;
    let profile=null;
    if(client){
        const {data}=await client.from("User").select("email,account_status,bio,Role(name)").eq("user_id",user.id).maybeSingle();
        profile=data;
    }
    const roleLabel=(profile?.Role?.name||"member").toLowerCase()==="admin"?"Admin":"Member";
    page.querySelectorAll("[data-profile-type],[data-profile-settings-role]").forEach(el=>el.replaceChildren(document.createTextNode(roleLabel)));
    page.querySelector("[data-profile-bio]")?.replaceChildren(document.createTextNode(profile?.bio||metadata.bio||"—"));
    const bioInput=page.querySelector("[data-profile-bio-input]");
    if(bioInput)bioInput.value=profile?.bio||metadata.bio||"";
    const form=page.querySelector("[data-profile-form]");
    form?.addEventListener("submit",async event=>{
        event.preventDefault();
        const message=page.querySelector("[data-auth-message]");
        const bio=form.elements.bio.value.trim();
        if(!client||!user){message.textContent="Profile service is unavailable.";return;}
        const {error}=await client.auth.updateUser({data:{...(user.user_metadata||{}),bio}});
        message.textContent=error?error.message:"Profile updated.";
        if(!error)page.querySelector("[data-profile-bio]")?.replaceChildren(document.createTextNode(bio||"—"));
    });
}