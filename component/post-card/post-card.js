import {toggleSave,sharePost} from "../../services/posts.js";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export function renderPostCard(post,{saved=false}={}){
  const el=document.createElement("article"); el.className="post-card card"; el.dataset.postId=post.id;
  el.innerHTML='<header class="post-card__head"><div class="post-card__avatar" aria-hidden="true">◉</div><div><strong>Community member</strong><small>'+new Date(post.created_at).toLocaleString()+'</small></div></header><div class="post-card__body">'+esc(post.content)+'</div><footer class="post-card__actions"><button type="button" data-post-action="comment">Comment</button><button type="button" data-post-action="share">Share</button><button type="button" data-post-action="save">'+(saved?"Saved":"Save")+'</button></footer>';
  el.querySelector('[data-post-action="save"]').addEventListener("click",async e=>{const r=await toggleSave(post.id,saved);if(!r.error){saved=!saved;e.currentTarget.textContent=saved?"Saved":"Save"}});
  el.querySelector('[data-post-action="share"]').addEventListener("click",async e=>{const r=await sharePost(post.id);e.currentTarget.textContent=r.error?"Share":"Shared"});
  return el;
}
