(function(){
const slot=document.querySelector('[data-context-slot="profile-avatar"]');
if(!slot||slot.querySelector('[data-component="profile-avatar"]'))return;
const button=document.createElement("button");button.type="button";button.dataset.component="profile-avatar";button.dataset.size="small";button.setAttribute("aria-expanded","false");button.setAttribute("aria-label","Open menu");
const visual=document.createElement("span");visual.className="avatar-visual";
const photo=document.createElement("img");photo.alt="";photo.hidden=true;
const fallback=document.createElement("span");fallback.className="avatar-fallback";
const menu=document.createElement("span");menu.className="avatar-menu-icon";menu.innerHTML="<i></i><i></i><i></i>";
visual.append(photo,fallback,menu);button.appendChild(visual);
let profileMode=true,timer=null;
async function refresh(){const session=await window.Dalimgari.auth?.getSession();const signedIn=Boolean(session?.data?.session);const p=signedIn?await window.Dalimgari.access?.profile():null;const url=p?.data?.avatar_url||"";photo.src=url;photo.hidden=!url;fallback.hidden=Boolean(url);profileMode=true;render();}
function render(){visual.classList.toggle("show-profile",profileMode);visual.classList.toggle("show-menu",!profileMode);}
function startToggle(){clearInterval(timer);timer=setInterval(()=>{profileMode=!profileMode;render();},2500);}
button.addEventListener("click",()=>{const sidebar=window.Dalimgari.sidebar;if(!sidebar)return;const open=!sidebar.isOpen();sidebar.setOpen(open);button.setAttribute("aria-expanded",String(open));button.setAttribute("aria-label",open?"Close menu":"Open menu");});
window.Dalimgari.controller?.subscribe((action)=>{if(action==="auth-state-change")refresh();if(action==="definition-change"&&window.Dalimgari.sidebar?.isOpen()){window.Dalimgari.sidebar.setOpen(false);button.setAttribute("aria-expanded","false");button.setAttribute("aria-label","Open menu");}});
slot.appendChild(button);refresh();startToggle();
})();