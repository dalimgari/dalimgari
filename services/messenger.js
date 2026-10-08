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
  const {data,error}=await db()
    .from("conversation_participants")
    .select("conversation_id,last_read_at,conversations(id,kind,updated_at,conversation_participants(user_id,last_read_at,public_profiles(user_id,display_name,avatar_url)))")
    .eq("user_id",userId)
    .order("last_read_at",{ascending:false});
  if(error) return {data:[],error};
  const rows=(data||[]).map(row=>{
    const participants=(row.conversations?.conversation_participants||[]).filter(p=>p.user_id!==userId);
    const other=participants[0]?.public_profiles||null;
    return {...row,conversation:row.conversations,other};
  }).sort((a,b)=>new Date(b.conversation?.updated_at||0)-new Date(a.conversation?.updated_at||0));
  return {data:rows,error:null};
}

export async function getMessages(conversationId,limit=50){
  if(!conversationId) return {data:[],error:null};
  const {data,error}=await db().from("messages")
    .select("id,conversation_id,sender_id,body,created_at,edited_at,deleted_at,public_profiles(user_id,display_name,avatar_url)")
    .eq("conversation_id",conversationId)
    .order("created_at",{ascending:true})
    .limit(limit);
  return {data:data||[],error};
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
