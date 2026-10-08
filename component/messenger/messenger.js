import {getCurrentUser,getOrCreateDirectConversation,getConversations,getMessages,sendMessage,markConversationRead} from "../../services/messenger.js";

const esc=s=>String(s??"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
let channel=null;

function hashParams(){
  const raw=window.location.hash.slice(1),i=raw.indexOf("?");
  return new URLSearchParams(i>=0?raw.slice(i+1):"");
}

export async function initMessenger(root){
  const page=root.querySelector("[data-messenger]"); if(!page)return;
  const user=await getCurrentUser(); if(!user)return;
  const list=page.querySelector("[data-messenger-conversations]");
  const messages=page.querySelector("[data-messenger-messages]");
  const head=page.querySelector("[data-messenger-chat-head]");
  const form=page.querySelector("[data-messenger-form]");
  const messageBox=page.querySelector("[data-messenger-message]");
  let activeId=null;

  const clearChannel=async()=>{if(channel){await window.dalimgariSupabase.removeChannel(channel);channel=null;}};

  const renderMessages=async()=>{
    if(!activeId)return;
    const r=await getMessages(activeId);
    if(r.error){messageBox.textContent=r.error.message;return;}
    messages.innerHTML=(r.data||[]).map(m=>{
      const own=m.sender_id===user.id;
      const name=m.public_profiles?.display_name||"Member";
      return '<article class="messenger__message '+(own?"is-own":"")+'"><div class="messenger__message-body">'+esc(m.deleted_at?"Message deleted":m.body)+'</div><div class="messenger__message-meta">'+esc(own?"You":name)+" · "+new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})+'</div></article>';
    }).join("")||'<div class="empty">No messages yet.</div>';
    messages.scrollTop=messages.scrollHeight;
    await markConversationRead(activeId,user.id);
  };

  const subscribe=async()=>{
    await clearChannel();
    if(!activeId)return;
    channel=window.dalimgariSupabase.channel("messenger-"+activeId)
      .on("postgres_changes",{event:"*",schema:"public",table:"messages",filter:"conversation_id=eq."+activeId},()=>{renderMessages();renderList();})
      .subscribe();
  };

  const openConversation=async(row)=>{
    activeId=row.conversation_id;
    page.querySelectorAll("[data-conversation-id]").forEach(x=>x.classList.toggle("is-active",x.dataset.conversationId===activeId));
    const name=row.other?.display_name||"Conversation";
    head.innerHTML='<strong>'+esc(name)+'</strong><div class="messenger__presence" data-messenger-presence>Offline</div>';
    form.hidden=false;
    await renderMessages(); await subscribe();
  };

  const renderList=async()=>{
    const r=await getConversations(user.id);
    if(r.error){list.innerHTML='<div class="empty">'+esc(r.error.message)+'</div>';return;}
    list.replaceChildren(...(r.data||[]).map(row=>{
      const button=document.createElement("button");button.type="button";button.className="messenger__conversation";button.dataset.conversationId=row.conversation_id;
      const avatar=document.createElement("img");avatar.className="messenger__avatar";avatar.src=row.other?.avatar_url||"";avatar.alt="";
      const text=document.createElement("span");const preview=row.lastMessage?.body||"No messages yet";text.innerHTML='<span class="messenger__name">'+esc(row.other?.display_name||"Member")+'</span><span class="messenger__preview">'+esc(preview.slice(0,70))+'</span>'+(row.unreadCount?'<strong class="messenger__unread">'+row.unreadCount+'</strong>':"");
      button.append(avatar,text);button.addEventListener("click",()=>openConversation(row));return button;
    }));
    const target=hashParams().get("user");
    if(target){
      const existing=(r.data||[]).find(x=>x.other?.user_id===target);
      if(existing) await openConversation(existing);
      else {
        const created=await getOrCreateDirectConversation(target);
        if(created.error){messageBox.textContent=created.error.message;return;}
        await renderList();
        const fresh=(await getConversations(user.id)).data?.find(x=>x.conversation_id===created.data);
        if(fresh) await openConversation(fresh);
      }
    }else if((r.data||[])[0]) await openConversation(r.data[0]);
  };

  form.addEventListener("submit",async e=>{
    e.preventDefault(); if(!activeId)return;
    const input=form.elements.body,body=input.value.trim(); if(!body)return;
    const result=await sendMessage(activeId,user.id,body);
    if(result.error){messageBox.textContent=result.error.message;return;}
    input.value=""; messageBox.textContent=""; await renderMessages();
  });

  await renderList();
  window.addEventListener("hashchange",()=>renderList());
}
