import {searchAll} from "../../services/search.js";
const pages=[{title:"Home",description:"Community landing page",path:"content/home.html"},{title:"Community",description:"Feed, members, events and gallery",path:"content/community.html"},{title:"Profile",description:"View account details",path:"content/profile.html"}];
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export function initSearch(root=document){
 const search=root.querySelector("[data-search]");const input=search?.querySelector(".search__input"),results=search?.querySelector("[data-search-results]"),toggle=search?.querySelector(".search__toggle");if(!search||!input||!results||!toggle)return;
 let timer;
 const render=async(query="")=>{
  const normalized=query.trim().toLocaleLowerCase();results.replaceChildren();results.hidden=false;
  if(!normalized){pages.forEach(p=>{const a=document.createElement("a");a.href="#"+p.path;a.dataset.route=p.path;a.innerHTML="<strong>"+esc(p.title)+"</strong><small>"+esc(p.description)+"</small>";results.append(a)});return}
  if(normalized.length<2){const e=document.createElement("span");e.className="search__empty";e.textContent="Type at least 2 characters.";results.append(e);return}
  const r=await searchAll(normalized);if(r.error){const e=document.createElement("span");e.className="search__empty";e.textContent=r.error.message;results.append(e);return}
  const add=(title,text,href)=>{const a=document.createElement("a");a.href=href;a.innerHTML="<strong>"+esc(title)+"</strong><small>"+esc(text)+"</small>";results.append(a)};
  (r.users||[]).forEach(u=>add("Person",u.display_name||"Profile","#content/profile.html?user="+encodeURIComponent(u.user_id)));
  (r.posts||[]).forEach(p=>add("Post",p.content||"Post","#content/home.html#post-"+p.id));
  (r.media||[]).forEach(m=>add(m.media_type==="video"?"Video":"Photo",m.title||m.description||"Media","#content/profile.html?user="+encodeURIComponent(m.user_id)));
  if(!results.children.length){const e=document.createElement("span");e.className="search__empty";e.textContent="No matching people, posts or media.";results.append(e);}
 };
 const close=()=>{search.classList.remove("is-open");toggle.setAttribute("aria-expanded","false")};
 toggle.addEventListener("click",()=>{const open=!search.classList.contains("is-open");search.classList.toggle("is-open",open);toggle.setAttribute("aria-expanded",String(open));if(open){render(input.value);requestAnimationFrame(()=>input.focus())}});
 input.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>render(input.value),180)});
 document.addEventListener("click",e=>{if(!search.contains(e.target))close()});
 input.addEventListener("keydown",e=>{if(e.key==="Escape"){close();toggle.focus()}});
 render();
}