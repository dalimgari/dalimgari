const db=()=>window.dalimgariSupabase;

export async function getCurrentUser(){
  const access=window.dalimgariAccess;
  const ctx=await access?.getContext?.();
  return ctx?.user||ctx?.session?.user||null;
}

export async function getOrCreateDirectConversation(otherUserId){
  if(!otherUserId) return {data:null,error:new Error("Missing user.")};
  const {data,error}=await db().rpc("get_or_create_direct_conversation",{p_other_user:otherUserId});
  return {data,error};
}

export async function getConversations(userId){
  if(!userId) return {data:[],error:null};
  const {data,error}=await db().from("conversation_participants")
    .select("conversation_id,last_read_at")
    .eq("user_id",userId);
  if(error) return {data:[],error};
  const ids=(data||[]).map(x=>x.conversation_id);
  if(!ids.length)return {data:[],error:null};
  const [{data:conversations,error:ce},{data:participants,error:pe}]=await Promise.all([
    db().from("conversations").select("id,kind,updated_at").in("id",ids),
    db().from("conversation_participants").select("conversation_id,user_id,last_read_at").in("conversation_id",ids).neq("user_id",userId)
  ]);
  if(ce||pe)return {data:[],error:ce||pe};
  const otherIds=[...new Set((participants||[]).map(x=>x.user_id))];
  const {data:profiles,error:pr}=otherIds.length
    ? await db().from("public_profiles").select("user_id,display_name,avatar_url").in("user_id",otherIds)
    : {data:[],error:null};
  if(pr)return {data:[],error:pr};
  const profileMap=new Map((profiles||[]).map(x=>[x.user_id,x]));
  const participantMap=new Map((participants||[]).map(x=>[x.conversation_id,x]));
  const rows=(data||[]).map(row=>{
    const conversation=(conversations||[]).find(x=>x.id===row.conversation_id);
    const otherParticipant=participantMap.get(row.conversation_id);
    return {...row,conversation,other:profileMap.get(otherParticipant?.user_id)||null};
  }).sort((a,b)=>new Date(b.conversation?.updated_at||0)-new Date(a.conversation?.updated_at||0));
  return {data:rows,error:null};
}

export async function getMessages(conversationId,limit=50){
  if(!conversationId) return {data:[],error:null};
  const {data,error}=await db().from("messages")
    .select("id,conversation_id,sender_id,body,created_at,edited_at,deleted_at")
    .eq("conversation_id",conversationId)
    .order("created_at",{ascending:true})
    .limit(limit);
  if(error)return {data:[],error};
  const senderIds=[...new Set((data||[]).map(x=>x.sender_id))];
  const {data:profiles,error:pr}=senderIds.length
    ? await db().from("public_profiles").select("user_id,display_name,avatar_url").in("user_id",senderIds)
    : {data:[],error:null};
  if(pr)return {data:[],error:pr};
  const profileMap=new Map((profiles||[]).map(x=>[x.user_id,x]));
  return {data:(data||[]).map(x=>({...x,public_profiles:profileMap.get(x.sender_id)||null})),error:null};
}

export async function sendMessage(conversationId,senderId,body){
  const text=String(body||"").trim();
  if(!text) return {data:null,error:new Error("Message cannot be empty.")};
  const {data,error}=await db().from("messages")
    .insert({conversation_id:conversationId,sender_id:senderId,body:text})
    .select("id,conversation_id,sender_id,body,created_at,edited_at")
    .single();
  return {data,error};
}

export async function markConversationRead(conversationId,userId){
  return db().from("conversation_participants")
    .update({last_read_at:new Date().toISOString()})
    .eq("conversation_id",conversationId)
    .eq("user_id",userId);
}
