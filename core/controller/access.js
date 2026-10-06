// Authorization and management controller

function getClient() {
  return window.Dalimgari?.supabase || null;
}

function accessError(message, cause = null) {
  return { error: { message, cause } };
}

async function getProfile() {
  const client = getClient();
  if (!client) return accessError("Database service is unavailable.");
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData?.user) return accessError("You must be signed in.");
  const { data, error } = await client.from("profiles").select("*").eq("id", userData.user.id).single();
  return error ? accessError(error.message, error) : { data };
}

async function isAdmin() {
  const result = await getProfile();
  return Boolean(result.data?.is_admin && result.data?.is_active);
}

async function adminListMembers() {
  if (!await isAdmin()) return accessError("Admin access required.");
  const client = getClient();
  const { data, error } = await client.from("profiles").select("id,email,display_name,is_admin,is_active,created_at").order("created_at", { ascending: false });
  return error ? accessError(error.message, error) : { data };
}

async function adminListRoles() {
  if (!await isAdmin()) return accessError("Admin access required.");
  const client = getClient();
  const { data, error } = await client.from("roles").select("*").order("name");
  return error ? accessError(error.message, error) : { data };
}

async function adminListPermissions() {
  if (!await isAdmin()) return accessError("Admin access required.");
  const client = getClient();
  const { data, error } = await client.from("permissions").select("*").order("key");
  return error ? accessError(error.message, error) : { data };
}

async function adminListAssignments() {
  if (!await isAdmin()) return accessError("Admin access required.");
  const client = getClient();
  const [roles, permissions] = await Promise.all([
    client.from("user_roles").select("user_id,role_id,roles(name)"),
    client.from("user_permissions").select("user_id,permission_id,allowed,permissions(key)")
  ]);
  if (roles.error) return accessError(roles.error.message, roles.error);
  if (permissions.error) return accessError(permissions.error.message, permissions.error);
  return { data: { roles: roles.data || [], permissions: permissions.data || [] } };
}

async function createRole(name, description = "") {
  if (!await isAdmin()) return accessError("Admin access required.");
  const { data, error } = await getClient().from("roles").insert({ name: name.trim(), description: description.trim() }).select().single();
  return error ? accessError(error.message, error) : { data };
}

async function deleteRole(id) {
  if (!await isAdmin()) return accessError("Admin access required.");
  const { error } = await getClient().from("roles").delete().eq("id", id);
  return error ? accessError(error.message, error) : { data: true };
}

async function createPermission(key, description = "") {
  if (!await isAdmin()) return accessError("Admin access required.");
  const { data, error } = await getClient().from("permissions").insert({ key: key.trim(), description: description.trim() }).select().single();
  return error ? accessError(error.message, error) : { data };
}

async function deletePermission(id) {
  if (!await isAdmin()) return accessError("Admin access required.");
  const { error } = await getClient().from("permissions").delete().eq("id", id);
  return error ? accessError(error.message, error) : { data: true };
}

async function assignRole(userId, roleId) {
  if (!await isAdmin()) return accessError("Admin access required.");
  const { error } = await getClient().from("user_roles").upsert({ user_id: userId, role_id: roleId });
  return error ? accessError(error.message, error) : { data: true };
}

async function revokeRole(userId, roleId) {
  if (!await isAdmin()) return accessError("Admin access required.");
  const { error } = await getClient().from("user_roles").delete().eq("user_id", userId).eq("role_id", roleId);
  return error ? accessError(error.message, error) : { data: true };
}

async function setDirectPermission(userId, permissionId, allowed) {
  if (!await isAdmin()) return accessError("Admin access required.");
  const { error } = await getClient().from("user_permissions").upsert({ user_id: userId, permission_id: permissionId, allowed });
  return error ? accessError(error.message, error) : { data: true };
}

async function removeDirectPermission(userId, permissionId) {
  if (!await isAdmin()) return accessError("Admin access required.");
  const { error } = await getClient().from("user_permissions").delete().eq("user_id", userId).eq("permission_id", permissionId);
  return error ? accessError(error.message, error) : { data: true };
}

async function setMemberActive(userId, isActive) {
  if (!await isAdmin()) return accessError("Admin access required.");
  const profile = await getProfile();
  if (profile.data?.id === userId) return accessError("You cannot deactivate your own admin account.");
  const { error } = await getClient().from("profiles").update({ is_active: Boolean(isActive) }).eq("id", userId).eq("is_admin", false);
  return error ? accessError(error.message, error) : { data: true };
}

async function getPublicContent() {
  const client = getClient();
  if (!client) return accessError("Database service is unavailable.");
  const { data, error } = await client.from("public_sections").select("id,slug,title,content,sort_order").eq("is_published", true).order("sort_order");
  return error ? accessError(error.message, error) : { data };
}

window.Dalimgari = window.Dalimgari || {};
window.Dalimgari.access = {
  getProfile, isAdmin, adminListMembers, adminListRoles, adminListPermissions,
  adminListAssignments, createRole, deleteRole, createPermission, deletePermission,
  assignRole, revokeRole, setDirectPermission, removeDirectPermission,
  setMemberActive, getPublicContent
};
