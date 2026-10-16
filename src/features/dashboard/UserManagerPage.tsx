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
    if (!supabase) throw new Error("Supabase configuration is missing.");
    const [usersResult, rolesResult, assignmentsResult] = await Promise.all([
      supabase.rpc("admin_list_registered_users"),
      supabase.from("roles").select("id,name,description,created_at,updated_at").order("name"),
      supabase.from("user_roles").select("user_id,role_id,created_at"),
    ]);
    if (usersResult.error) throw new Error("Could not load the admin user list.");
    if (rolesResult.error) throw rolesResult.error;
    if (assignmentsResult.error) throw assignmentsResult.error;
    const userRows = usersResult.data ?? [];
    const roleRows = rolesResult.data ?? [];
    const assignmentRows = assignmentsResult.data ?? [];
    setUsers(userRows);
    setRoles(roleRows);
    setAssignments(assignmentRows);
    setSelectedUserId((current) =>
      userRows.some((user) => user.user_id === current) ? current : (userRows[0]?.user_id ?? ""),
    );
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (!supabase) throw new Error("Supabase configuration is missing.");
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw new Error("Log in to manage users.");
        if (String(authData.user.app_metadata?.role ?? "").toLowerCase() !== "admin") {
          throw new Error("A trusted admin role is required for this section.");
        }
        const { data: grants, error: permissionError } = await supabase.rpc("get_my_permissions");
        if (permissionError || !grants.includes("roles.manage")) {
          throw new Error("The roles.manage permission is required to assign roles.");
        }
        await load();
      } catch (loadError) {
        if (active)
          setError(loadError instanceof Error ? loadError.message : "User data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [load]);

  const selectedUser = users.find((user) => user.user_id === selectedUserId) ?? null;

  useEffect(() => {
    setSelectedRoleIds(
      assignments
        .filter((assignment) => assignment.user_id === selectedUserId)
        .map((assignment) => assignment.role_id),
    );
  }, [assignments, selectedUserId]);

  const save = async () => {
    if (!supabase || !selectedUserId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const currentIds = assignments
        .filter((assignment) => assignment.user_id === selectedUserId)
        .map((assignment) => assignment.role_id);
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
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(toAdd.map((role_id) => ({ user_id: selectedUserId, role_id })));
        if (insertError) throw insertError;
      }
      await load();
      setMessage("User role assignments saved.");
    } catch {
      setError("Role assignment did not complete. Reload and verify the current assignments.");
      try {
        await load();
      } catch {
        /* Keep the original error visible. */
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p role="status">Checking admin and roles.manage permissions…</p>;
  if (error && users.length === 0)
    return (
      <section className="notice-card">
        <h1>User Management</h1>
        <p role="alert">{error}</p>
        <Link to="/dashboard">Return to dashboard</Link>
      </section>
    );

  return (
    <section className="user-manager" aria-labelledby="user-manager-title">
      <p>
        <Link to="/dashboard">← Dashboard</Link>
      </p>
      <h1 id="user-manager-title">User and Role Assignment</h1>
      <p>
        Only trusted admins can view this list. Roles can be assigned here; Auth users
        cannot be deleted, banned, or have their email changed here.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <div className="user-manager-layout">
        <nav className="registered-user-list" aria-label="Registered users">
          {users.map((user) => (
            <button
              key={user.user_id}
              type="button"
              aria-current={user.user_id === selectedUserId ? "true" : undefined}
              onClick={() => setSelectedUserId(user.user_id)}
            >
              <strong>{user.full_name || "Name not provided"}</strong>
              <small>{user.email}</small>
            </button>
          ))}
        </nav>
        {selectedUser ? (
          <section className="user-role-editor" aria-labelledby="user-role-title">
            <h2 id="user-role-title">{selectedUser.full_name || selectedUser.email}</h2>
            <p>{selectedUser.email}</p>
            <p>
              Select the required roles. Role changes may affect permissions
              immediately.
            </p>
            {roles.map((role) => (
              <label className="permission-option" key={role.id}>
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={(event) =>
                    setSelectedRoleIds((current) =>
                      event.target.checked
                        ? [...current, role.id]
                        : current.filter((id) => id !== role.id),
                    )
                  }
                />
                <span>
                  <strong>{role.name}</strong>
                  {role.description ? <small>{role.description}</small> : null}
                </span>
              </label>
            ))}
            <button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save role assignments"}
            </button>
          </section>
        ) : (
          <p>No other registered users were found.</p>
        )}
      </div>
    </section>
  );
}
