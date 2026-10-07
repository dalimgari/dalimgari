export function initMenu(root=document){
 const toggle=root.querySelector("[data-menu] .menu__toggle"); if(!toggle)return;
 const menu=toggle.closest("[data-menu]"); const list=menu?.querySelector(".menu__list"); if(!list)return;
 const close=()=>{toggle.setAttribute("aria-expanded","false");list.hidden=true;};
 toggle.addEventListener("click",event=>{event.stopPropagation();const open=toggle.getAttribute("aria-expanded")==="true";toggle.setAttribute("aria-expanded",String(!open));list.hidden=open;});
 document.addEventListener("click",event=>{if(!menu.contains(event.target))close();});
 document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
}