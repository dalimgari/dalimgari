const db=window.dalimgariSupabase;
async function me(){return (await window.dalimgariAccess?.getContext?.())?.user||null}
export async function listStories(){return db.from("stories").select("id,user_id,media_url,media_type,caption,created_at,expires_at").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(50)}
export async function createStory({media_url,media_type,caption=""}){const u=await me();if(!u)return {error:new Error("Sign in required.")};return db.from("stories").insert({user_id:u.id,media_url,media_type,caption}).select().single()}
export async function listSavedPosts(){const u=await me();if(!u)return {data:[],error:new Error("Sign in required.")};return db.from("saved_posts").select("post_id,created_at").eq("user_id",u.id).order("created_at",{ascending:false}).limit(100)}
