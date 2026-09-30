import { createClient } from "npm:@supabase/supabase-js@2";

type Action = "create" | "update" | "delete";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Invalid session" }, 401);
    const actorId = authData.user.id;
    const adminClient = createClient(url, serviceKey);
    const { data: actor } = await adminClient.from("profiles").select("profile_id,is_active").eq("profile_id", actorId).maybeSingle();
    if (!actor?.is_active) return json({ error: "Admin access required" }, 403);
    const { data: permissionRows } = await adminClient.from("user_roles").select("roles(role_permissions(permissions(permission_key)))").eq("profile_id", actorId);
    const permissions = new Set((permissionRows ?? []).flatMap((row: any) => (row.roles?.role_permissions ?? []).map((item: any) => item.permissions?.permission_key).filter(Boolean)));
    if (!permissions.has("user_manage")) return json({ error: "User management permission required" }, 403);

    const body = await req.json();
    const action = body.action as Action;
    const targetId = body.profile_id as string | undefined;
    if (!["create", "update", "delete"].includes(action)) return json({ error: "Invalid action" }, 400);

    const allowedRoles = new Set(["user", "editor", "moderator", "manager", "admin"]);

    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const roleKey = String(body.role_key ?? "user");
      if (!email || password.length < 8 || !allowedRoles.has(roleKey)) return json({ error: "Valid email, password and role are required" }, 400);
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: String(body.display_name ?? "").trim() } });
      if (createError || !created.user) return json({ error: createError?.message ?? "Account creation failed" }, 400);
      const newId = created.user.id;
      const { error: profileError } = await adminClient.from("profiles").update({
        display_name: String(body.display_name ?? "").trim() || null,
        email, phone: String(body.phone ?? "").trim() || null,
        account_type: roleKey === "user" ? "user" : "admin", is_active: true
      }).eq("profile_id", newId);
      if (profileError) { await adminClient.auth.admin.deleteUser(newId); throw profileError; }
      const { data: role, error: roleError } = await adminClient.from("roles").select("role_id").eq("role_key", roleKey).single();
      if (roleError || !role) { await adminClient.auth.admin.deleteUser(newId); return json({ error: roleError?.message ?? "Role not found" }, 400); }
      const { error: roleAssignError } = await adminClient.from("user_roles").insert({ profile_id: newId, role_id: role.role_id, assigned_by: actorId });
      if (roleAssignError) { await adminClient.auth.admin.deleteUser(newId); throw roleAssignError; }
      await adminClient.from("audit_logs").insert({ actor_profile_id: actorId, action_key: "account_create", entity_type: "profile", entity_id: newId, action_data: { role_key: roleKey, email } });
      return json({ success: true, profile_id: newId });
    }

    if (!targetId) return json({ error: "Profile ID is required" }, 400);
    const { data: target } = await adminClient.from("profiles").select("profile_id,is_super_admin").eq("profile_id", targetId).maybeSingle();
    if (!target) return json({ error: "Account not found" }, 404);
    if (target.is_super_admin) return json({ error: "Super Admin cannot be changed or deleted" }, 403);

    if (action === "update") {
      const updates: Record<string, unknown> = {};
      if (body.display_name !== undefined) updates.display_name = String(body.display_name).trim() || null;
      if (body.phone !== undefined) updates.phone = String(body.phone).trim() || null;
      if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
      if (body.email !== undefined) {
        const email = String(body.email).trim().toLowerCase();
        if (!email) return json({ error: "Email cannot be empty" }, 400);
        const { error } = await adminClient.auth.admin.updateUserById(targetId, { email, email_confirm: true });
        if (error) return json({ error: error.message }, 400);
        updates.email = email;
      }
      if (body.password) {
        const password = String(body.password);
        if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);
        const { error } = await adminClient.auth.admin.updateUserById(targetId, { password });
        if (error) return json({ error: error.message }, 400);
      }
      if (body.role_key) {
        const roleKey = String(body.role_key);
        if (!allowedRoles.has(roleKey)) return json({ error: "Invalid role" }, 400);
        const { data: role } = await adminClient.from("roles").select("role_id").eq("role_key", roleKey).single();
        if (!role) return json({ error: "Role not found" }, 400);
        await adminClient.from("user_roles").delete().eq("profile_id", targetId);
        await adminClient.from("user_roles").insert({ profile_id: targetId, role_id: role.role_id, assigned_by: actorId });
        updates.account_type = roleKey === "user" ? "user" : "admin";
      }
      if (Object.keys(updates).length) {
        const { error } = await adminClient.from("profiles").update(updates).eq("profile_id", targetId);
        if (error) throw error;
      }
      await adminClient.from("audit_logs").insert({ actor_profile_id: actorId, action_key: "account_update", entity_type: "profile", entity_id: targetId, action_data: { changed_fields: Object.keys(updates) } });
      return json({ success: true });
    }

    await adminClient.from("user_roles").delete().eq("profile_id", targetId);
    await adminClient.from("admin_information").delete().eq("profile_id", targetId);
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetId);
    if (deleteError) return json({ error: deleteError.message }, 400);
    await adminClient.from("audit_logs").insert({ actor_profile_id: actorId, action_key: "account_delete", entity_type: "profile", entity_id: targetId, action_data: {} });
    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Account management failed" }, 500);
  }
});