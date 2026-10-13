import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Tables } from "../../types/database.types";
import { supabase } from "../../services/supabase";

type Role = Tables<"roles">;
type Assignment = Tables<"user_roles">;

interface RegisteredUser {
  user_id: string;
  email: string;
  full_name: string;
}

export function UserManagerPage() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!supabase) throw new Error("Supabase configuration পাওয়া যায়নি।");
    const [usersResult, rolesResult, assignmentsResult] = await Promise.all([
      supabase.rpc("admin_list_registered_users"),
      supabase.from("roles").select("id,name,description,created_at,updated_at").order("name"),
      supabase.from("user_roles").select("user_id,role_id,created_at"),
    ]);
    if (usersResult.error) throw new Error("Admin user list লোড করা যায়নি।");
    if (rolesResult.error) throw rolesResult.error;
    if (assignmentsResult.error) throw assignmentsResult.error;
    const userRows = usersResult.data ?? [];
    const roleRows = rolesResult.data ?? [];
    const assignmentRows = assignmentsResult.data ?? [];
    setUsers(userRows);
    setRoles(roleRows);
    setAssignments(assignmentRows);
    setSelectedUserId((current) => userRows.some((user) => user.user_id === current) ? current : userRows[0]?.user_id ?? "");
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (!supabase) throw new Error("Supabase configuration পাওয়া যায়নি।");
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw new Error("User management করতে লগইন করতে হবে।");
        if (String(authData.user.app_metadata?.role ?? "").toLowerCase() !== "admin") {
          throw new Error("এই বিভাগের জন্য trusted admin role প্রয়োজন।");
        }
        const { data: grants, error: permissionError } = await supabase.rpc("get_my_permissions");
        if (permissionError || !grants.includes("roles.manage")) {
          throw new Error("Role assignment-এর জন্য roles.manage permission প্রয়োজন।");
        }
        await load();
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "User data লোড করা যায়নি।");
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => { active = false; };
  }, [load]);

  const selectedUser = users.find((user) => user.user_id === selectedUserId) ?? null;

  useEffect(() => {
    setSelectedRoleIds(
      assignments.filter((assignment) => assignment.user_id === selectedUserId).map((assignment) => assignment.role_id),
    );
  }, [assignments, selectedUserId]);

  const save = async () => {
    if (!supabase || !selectedUserId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const currentIds = assignments.filter((assignment) => assignment.user_id === selectedUserId).map((assignment) => assignment.role_id);
      const toRemove = currentIds.filter((id) => !selectedRoleIds.includes(id));
      const toAdd = selectedRoleIds.filter((id) => !currentIds.includes(id));

      // Revoke first to avoid leaving permissions the admin intended to remove.
      if (toRemove.length) {
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedUserId)
          .in("role_id", toRemove);
        if (deleteError) throw deleteError;
      }
      if (toAdd.length) {
        const { error: insertError } = await supabase.from("user_roles").insert(
          toAdd.map((role_id) => ({ user_id: selectedUserId, role_id })),
        );
        if (insertError) throw insertError;
      }
      await load();
      setMessage("User role assignments সংরক্ষণ হয়েছে।");
    } catch {
      setError("Role assignment সম্পূর্ণ হয়নি। বর্তমান assignment reload করে যাচাই করুন।");
      try { await load(); } catch { /* Keep the original error visible. */ }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p role="status">Admin ও roles.manage permission যাচাই হচ্ছে…</p>;
  if (error && users.length === 0) return <section className="notice-card"><h1>User Management</h1><p role="alert">{error}</p><Link to="/dashboard">ড্যাশবোর্ডে ফিরুন</Link></section>;

  return (
    <section className="user-manager" aria-labelledby="user-manager-title">
      <p><Link to="/dashboard">← ড্যাশবোর্ড</Link></p>
      <h1 id="user-manager-title">User ও Role Assignment</h1>
      <p>শুধু trusted admin এই তালিকা দেখতে পারেন। এখানে role assignment করা যায়; Auth user delete/ban বা email পরিবর্তন করা হয় না।</p>
      {error ? <p role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <div className="user-manager-layout">
        <nav className="registered-user-list" aria-label="Registered users">
          {users.map((user) => (
            <button key={user.user_id} type="button" aria-current={user.user_id === selectedUserId ? "true" : undefined} onClick={() => setSelectedUserId(user.user_id)}>
              <strong>{user.full_name || "নাম যোগ করা হয়নি"}</strong>
              <small>{user.email}</small>
            </button>
          ))}
        </nav>
        {selectedUser ? (
          <section className="user-role-editor" aria-labelledby="user-role-title">
            <h2 id="user-role-title">{selectedUser.full_name || selectedUser.email}</h2>
            <p>{selectedUser.email}</p>
            <p>যে role গুলো প্রয়োজন সেগুলো নির্বাচন করুন। Role পরিবর্তন করলে সংশ্লিষ্ট permission সঙ্গে সঙ্গে কার্যকর হতে পারে।</p>
            {roles.map((role) => (
              <label className="permission-option" key={role.id}>
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={(event) => setSelectedRoleIds((current) => event.target.checked ? [...current, role.id] : current.filter((id) => id !== role.id))}
                />
                <span><strong>{role.name}</strong>{role.description ? <small>{role.description}</small> : null}</span>
              </label>
            ))}
            <button type="button" disabled={saving} onClick={() => void save()}>{saving ? "সংরক্ষণ হচ্ছে…" : "Role assignments সংরক্ষণ"}</button>
          </section>
        ) : <p>কোনো অন্য নিবন্ধিত ব্যবহারকারী পাওয়া যায়নি।</p>}
      </div>
    </section>
  );
}
