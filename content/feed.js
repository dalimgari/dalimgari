import {getFeed,createPost} from "../services/posts.js";
import {renderPostCard} from "../component/post-card/post-card.js";
export async function initFeed(root=document){
 const box=root.querySelector("[data-feed]");if(!box)return;
 const form=root.querySelector("[data-feed-composer]"),fileInput=form?.querySelector("[data-post-media]"),selected=form?.querySelector("[data-selected-media]");
 let offset=0,loading=false,done=false;
 const render=async(reset=false)=>{
  if(loading||done)return;loading=true;
  const r=await getFeed({limit:10,offset});
  if(r.error){if(reset)box.innerHTML='<div class="empty">'+r.error.message+"</div>";loading=false;return}
  if(reset)box.replaceChildren();
  for(const post of r.data||[])box.append(await renderPostCard(post));
  if((r.data||[]).length<10)done=true;else offset+=10;
  const more=box.parentElement.querySelector("[data-feed-more]");if(more)more.hidden=done;
  loading=false;
 };
 fileInput?.addEventListener("change",()=>{const files=[...(fileInput.files||[])];selected.textContent=files.length?files.map(x=>x.name).join(", "):"No media selected"});
 form?.addEventListener("submit",async e=>{
  e.preventDefault();if(loading)return;
  const input=form.elements.content,msg=form.querySelector("[data-feed-message]"),button=form.querySelector('button[type="submit"]'),files=[...(fileInput?.files||[])];
  form.setAttribute("aria-busy","true");button.disabled=true;
  const r=await createPost({content:input.value,visibility:form.elements.visibility?.value||"public",files});
  if(r.error){msg.textContent=r.error.message;msg.dataset.state="error";form.removeAttribute("aria-busy");button.disabled=false;return}
  input.value="";if(fileInput)fileInput.value="";if(selected)selected.textContent="No media selected";msg.textContent="Published.";msg.dataset.state="success";offset=0;done=false;form.removeAttribute("aria-busy");button.disabled=false;await render(true);\n const focus=sessionStorage.getItem("dalimgari:focusPost");if(focus){const el=document.querySelector(`[data-post-id="${focus}"]`);if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.add("is-focus");}sessionStorage.removeItem("dalimgari:focusPost");}
 });
 root.querySelector("[data-feed-more]")?.addEventListener("click",()=>render(false));
 await render(true);
}