import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return response({ error: "Server auth configuration is missing." }, 500);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return response({ error: "Authentication required." }, 401);

  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerData, error: callerError } = await authClient.auth.getUser(token);
  const caller = callerData?.user;
  if (callerError || !caller) return response({ error: "Invalid session." }, 401);
  if (String(caller.app_metadata?.role || "").toLowerCase() !== "admin") {
    return response({ error: "Administrator access required." }, 403);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "list_users") {
      const users: Array<Record<string, unknown>> = [];
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
        if (error) throw error;
        users.push(...data.users.map((u) => ({
          id: u.id, email: u.email, created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          role: String(u.app_metadata?.role || "member").toLowerCase(),
          email_confirmed_at: u.email_confirmed_at,
        })));
        if (data.users.length < 100) break;
      }
      return response({ users });
    }

    if (action === "create_user") {
      const email = String(body?.email || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const makeAdmin = body?.admin === true;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response({ error: "A valid email is required." }, 400);
      if (password.length < 8) return response({ error: "Password must be at least 8 characters." }, 400);
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        app_metadata: makeAdmin ? { role: "admin" } : { role: "member" },
      });
      if (error) throw error;
      return response({ user: { id: data.user.id, email: data.user.email, role: makeAdmin ? "admin" : "member" } }, 201);
    }

    if (action === "delete_user") {
      const userId = String(body?.user_id || "");
      if (!userId) return response({ error: "User ID is required." }, 400);
      if (userId === caller.id) return response({ error: "You cannot delete the currently signed-in administrator." }, 400);
      const { data: targetData, error: targetError } = await admin.auth.admin.getUserById(userId);
      if (targetError) throw targetError;
      if (String(targetData.user.app_metadata?.role || "").toLowerCase() === "admin") {
        const { data: allUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listError) throw listError;
        const admins = allUsers.users.filter((u) => String(u.app_metadata?.role || "").toLowerCase() === "admin");
        if (admins.length <= 1) return response({ error: "The last administrator cannot be deleted." }, 409);
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return response({ success: true });
    }

    if (action === "set_admin") {
      const userId = String(body?.user_id || "");
      const makeAdmin = body?.admin === true;
      if (!userId) return response({ error: "User ID is required." }, 400);
      if (userId === caller.id && !makeAdmin) return response({ error: "You cannot remove your own administrator role." }, 400);
      const { data: targetData, error: targetError } = await admin.auth.admin.getUserById(userId);
      if (targetError) throw targetError;
      const target = targetData.user;
      const currentRole = String(target.app_metadata?.role || "").toLowerCase();
      if (!makeAdmin && currentRole === "admin") {
        const { data: allUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listError) throw listError;
        const admins = allUsers.users.filter((u) => String(u.app_metadata?.role || "").toLowerCase() === "admin");
        if (admins.length <= 1) return response({ error: "The last administrator cannot be demoted." }, 409);
      }
      const nextMetadata = { ...(target.app_metadata || {}), role: makeAdmin ? "admin" : "member" };
      const { data, error } = await admin.auth.admin.updateUserById(userId, { app_metadata: nextMetadata });
      if (error) throw error;
      return response({ user: { id: data.user.id, email: data.user.email, role: nextMetadata.role } });
    }

    return response({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("admin-user-management failure:", error);
    return response({ error: error instanceof Error ? error.message : "Request failed." }, 400);
  }
});
