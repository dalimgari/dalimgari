import {getFeed,createPost} from "../services/posts.js";
import {renderPostCard} from "../component/post-card/post-card.js";
export async function initFeed(root=document){
 const box=root.querySelector("[data-feed]");if(!box)return;
 const form=root.querySelector("[data-feed-composer]"),fileInput=form?.querySelector("[data-post-media]");
 let offset=0,loading=false,done=false;
 const render=async(reset=false)=>{
  if(loading||done)return;loading=true;
  const r=await getFeed({limit:10,offset});
  if(r.error){if(reset)box.innerHTML='<div class="empty">'+r.error.message+"</div>";loading=false;return}
  if(reset)box.replaceChildren();
  for(const post of r.data||[])box.append(await renderPostCard(post));
  if((r.data||[]).length<10)done=true; else offset+=10;
  const more=box.parentElement.querySelector("[data-feed-more]");if(more)more.hidden=done;
  loading=false;
 };
 form?.addEventListener("submit",async e=>{e.preventDefault();const input=form.elements.content,msg=form.querySelector("[data-feed-message]"),files=[...(fileInput?.files||[])];const r=await createPost({content:input.value,visibility:form.elements.visibility?.value||"public",files});if(r.error){msg.textContent=r.error.message;msg.dataset.state="error";return}input.value="";if(fileInput)fileInput.value="";msg.textContent="Published.";msg.dataset.state="success";offset=0;done=false;await render(true)});
 root.querySelector("[data-feed-more]")?.addEventListener("click",()=>render(false));
 await render(true);
}
