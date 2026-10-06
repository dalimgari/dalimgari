let currentDefinition=null;const listeners=new Set();const actionState={busy:false,action:null};
function dispatch(action,payload={}){for(const listener of listeners){try{listener(action,payload);}catch(error){console.error(error);}}}
function setDefinition(id){const registry=window.Dalimgari?.registry?.definition||{};if(!id||!Object.prototype.hasOwnProperty.call(registry,id)){dispatch("action-error",{action:"navigation",error:{message:"Unknown definition."}});return false;}if(currentDefinition===id)return true;currentDefinition=id;dispatch("definition-change",{id});return true;}
function getDefinition(){return currentDefinition;}
function subscribe(listener){if(typeof listener!=="function")return()=>{};listeners.add(listener);return()=>listeners.delete(listener);}
function setBusy(action){actionState.busy=Boolean(action);actionState.action=action||null;dispatch("action-state-change",{...actionState});}
function isBusy(){return actionState.busy;}
function client(){return window.Dalimgari?.supabase||null;}
function accessError(message,cause=null){return{error:{message,cause}};}
async function profile(){const c=client();if(!c)return accessError("Database service is unavailable.");const{data:u,error:ue}=await c.auth.getUser();if(ue||!u?.user)return accessError("You must be signed in.");const{data,error}=await c.from("profiles").select("id,email,display_name,is_admin,is_active,created_at,updated_at").eq("id",u.user.id).single();if(error)return accessError(error.message,error);if(!data.is_active)return accessError("This account is disabled.");return{data};}
async function isAdmin(){const p=await profile();return Boolean(p.data?.is_admin&&p.data?.is_active);}
async function can(permissionKey){if(!permissionKey)return false;const c=client();if(!c)return false;const{data,error}=await c.rpc("has_permission",{requested_key:permissionKey});return !error&&data===true;}
async function adminData(){if(!await isAdmin())return accessError("Admin access required.");const c=client();const [m,r,p,ur,up,s,pc]=await Promise.all([c.from("profiles").select("id,email,display_name,is_admin,is_active,created_at").order("created_at",{ascending:false}),c.from("roles").select("id,name,description,created_at").order("name"),c.from("permissions").select("id,key,description,created_at").order("key"),c.from("user_roles").select("user_id,role_id,roles(name)"),c.from("user_permissions").select("user_id,permission_id,allowed,permissions(key)"),c.from("site_settings").select("key,value,is_public,updated_at,updated_by").order("key"),c.from("public_sections").select("id,slug,title,content,sort_order,is_published,created_at,updated_at").order("sort_order")]);for(const x of[m,r,p,ur,up,s,pc])if(x.error)return accessError(x.error.message,x.error);return{data:{members:m.data,roles:r.data,permissions:p.data,userRoles:ur.data,userPermissions:up.data,settings:s.data,sections:pc.data}};}
async function adminCreateRole(name,description=""){if(!await isAdmin())return accessError("Admin access required.");name=name.trim();description=description.trim();if(!name)return accessError("Role name is required.");const{error}=await client().from("roles").insert({name,description});return error?accessError(error.message,error):{data:true};}
async function adminDeleteRole(id){if(!await isAdmin())return accessError("Admin access required.");const c=client();const{count,error:ce}=await c.from("user_roles").select("user_id",{count:"exact",head:true}).eq("role_id",id);if(ce)return accessError(ce.message,ce);const{count:pc,error:pe}=await c.from("role_permissions").select("permission_id",{count:"exact",head:true}).eq("role_id",id);if(pe)return accessError(pe.message,pe);if((count||0)>0||(pc||0)>0)return accessError("Cannot delete a role while it is assigned or has permissions.");const{error}=await c.from("roles").delete().eq("id",id);return error?accessError(error.message,error):{data:true};}
async function adminCreatePermission(key,description=""){if(!await isAdmin())return accessError("Admin access required.");key=key.trim();description=description.trim();if(!/^[a-z][a-z0-9_.:-]{1,127}$/.test(key))return accessError("Permission key must use lowercase letters, numbers, dots, underscores, colons or hyphens.");const{error}=await client().from("permissions").insert({key,description});return error?accessError(error.message,error):{data:true};}
async function adminDeletePermission(id){if(!await isAdmin())return accessError("Admin access required.");const c=client();const{count,error:ue}=await c.from("user_permissions").select("user_id",{count:"exact",head:true}).eq("permission_id",id);if(ue)return accessError(ue.message,ue);const{count:re,error:pe}=await c.from("role_permissions").select("role_id",{count:"exact",head:true}).eq("permission_id",id);if(pe)return accessError(pe.message,pe);if((count||0)>0||(re||0)>0)return accessError("Cannot delete a permission while it is assigned or attached to a role.");const{error}=await c.from("permissions").delete().eq("id",id);return error?accessError(error.message,error):{data:true};}
async function adminSetRole(userId,roleId,enabled){if(!await isAdmin())return accessError("Admin access required.");const q=client().from("user_roles");const r=enabled?await q.upsert({user_id:userId,role_id:roleId}):await q.delete().eq("user_id",userId).eq("role_id",roleId);return r.error?accessError(r.error.message,r.error):{data:true};}
async function adminSetPermission(userId,permissionId,allowed){if(!await isAdmin())return accessError("Admin access required.");const{error}=await client().from("user_permissions").upsert({user_id:userId,permission_id:permissionId,allowed});return error?accessError(error.message,error):{data:true};}
async function adminRemovePermission(userId,permissionId){if(!await isAdmin())return accessError("Admin access required.");const{error}=await client().from("user_permissions").delete().eq("user_id",userId).eq("permission_id",permissionId);return error?accessError(error.message,error):{data:true};}
async function adminSetMemberActive(userId,isActive){if(!await isAdmin())return accessError("Admin access required.");const me=await profile();if(me.data?.id===userId)return accessError("You cannot deactivate your own admin account.");const{error}=await client().from("profiles").update({is_active:Boolean(isActive)}).eq("id",userId).eq("is_admin",false);return error?accessError(error.message,error):{data:true};}
async function adminSaveSetting(key,value,isPublic){if(!await isAdmin())return accessError("Admin access required.");key=key.trim();if(!key)return accessError("Setting key is required.");const me=await profile();const{error}=await client().from("site_settings").upsert({key,value,is_public:Boolean(isPublic),updated_by:me.data?.id||null});return error?accessError(error.message,error):{data:true};}
async function adminDeleteSetting(key){if(!await isAdmin())return accessError("Admin access required.");const{error}=await client().from("site_settings").delete().eq("key",key);return error?accessError(error.message,error):{data:true};}
async function adminSaveSection(payload){if(!await isAdmin())return accessError("Admin access required.");const normalized={...payload,slug:String(payload.slug||"").trim(),title:String(payload.title||"").trim(),content:String(payload.content||"")};if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(normalized.slug))return accessError("Section slug must use lowercase letters, numbers and hyphens.");if(!normalized.title)return accessError("Section title is required.");const{error}=await client().from("public_sections").upsert(normalized,{onConflict:"slug"});return error?accessError(error.message,error):{data:true};}
async function adminDeleteSection(id){if(!await isAdmin())return accessError("Admin access required.");const{error}=await client().from("public_sections").delete().eq("id",id);return error?accessError(error.message,error):{data:true};}
async function getPublicContent(){const c=client();if(!c)return accessError("Database service is unavailable.");const{data,error}=await c.from("public_sections").select("title,content,sort_order").eq("is_published",true).order("sort_order");return error?accessError(error.message,error):{data};}
async function handleAction(action,payload={}) {
  const auth=window.Dalimgari?.auth;
  if(action==="go-login") return setDefinition("login");
  if(action==="forgot-password") return setDefinition("reset-password");
  if(action==="create-account") return setDefinition("register");
  if(action==="back-home") return setDefinition("home");
  if(action==="back-login") return setDefinition("login");
  if(action==="profile") {
    if(!auth) return accessError("Authentication service is unavailable.");
    const session=await auth.getSession();
    return session?.error ? session : setDefinition(session?.data?.session ? "profile" : "login");
  }
  if(action==="admin") {
    if(await isAdmin()) return setDefinition("admin");
    return accessError("Admin access required.");
  }
  if(!auth) return accessError("Authentication service is unavailable.");
  if(isBusy()) return accessError("Please wait for the current action to finish.");
  let result;
  setBusy(action);
  try {
    if(action==="login") {
      result=await auth.login(payload.identifier||"",payload.password||"");
      if(!result?.error) setDefinition("home");
    } else if(action==="register") {
      result=await auth.register(payload.email||"",payload.password||"");
      if(!result?.error && result.data?.session) setDefinition("home");
    } else if(action==="reset-password") {
      result=await auth.resetPassword(payload.email||"");
    } else if(action==="update-password") {
      if(payload.password!==payload.confirm_password) return accessError("Passwords do not match.");
      result=await auth.updatePassword(payload.password||"");
      if(!result?.error) setDefinition("home");
    } else if(action==="logout") {
      result=await auth.logout();
      if(!result?.error) setDefinition("home");
    } else {
      result={error:{message:"Unknown action: "+action}};
    }
    return result;
  } catch(error) {
    return accessError(error?.message||"An unexpected error occurred.",error);
  } finally {
    setBusy(null);
  }
}
window.Dalimgari=window.Dalimgari||{};window.Dalimgari.controller={dispatch,setDefinition,getDefinition,subscribe,isBusy,handleAction};window.Dalimgari.access={profile,isAdmin,can,adminData,adminCreateRole,adminDeleteRole,adminCreatePermission,adminDeletePermission,adminSetRole,adminSetPermission,adminRemovePermission,adminSetMemberActive,adminSaveSetting,adminDeleteSetting,adminSaveSection,adminDeleteSection,getPublicContent};