import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Tables, TablesInsert, TablesUpdate } from "../../types/database.types";
import { supabase } from "../../services/supabase";

type Role = Tables<"roles">;
type Permission = Tables<"permissions">;
type RolePermission = Tables<"role_permissions">;

export function RoleManagerPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignments, setAssignments] = useState<RolePermission[]>([]);
  const [ownRoleIds, setOwnRoleIds] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!supabase) throw new Error("Supabase configuration is missing.");
    const [rolesResult, permissionsResult, assignmentResult] = await Promise.all([
      supabase.from("roles").select("id,name,description,created_at,updated_at").order("name"),
      supabase
        .from("permissions")
        .select("id,name,description,created_at,updated_at")
        .order("name"),
      supabase.from("role_permissions").select("role_id,permission_id"),
    ]);
    if (rolesResult.error) throw rolesResult.error;
    if (permissionsResult.error) throw permissionsResult.error;
    if (assignmentResult.error) throw assignmentResult.error;
    const roleRows = rolesResult.data ?? [];
    const permissionRows = permissionsResult.data ?? [];
    const assignmentRows = assignmentResult.data ?? [];
    setRoles(roleRows);
    setPermissions(permissionRows);
    setAssignments(assignmentRows);
    setSelectedRoleId((current) =>
      roleRows.some((role) => role.id === current) ? current : (roleRows[0]?.id ?? ""),
    );
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (!supabase) throw new Error("Supabase configuration is missing.");
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData.user) throw new Error("Log in to manage roles.");
        const { data: grants, error: permissionError } = await supabase.rpc("get_my_permissions");
        if (permissionError || !grants.includes("roles.manage")) {
          throw new Error("The roles.manage permission is required for this section.");
        }
        const { data: ownAssignments, error: ownRoleError } = await supabase
          .from("user_roles")
          .select("role_id")
          .eq("user_id", userData.user.id);
        if (ownRoleError) throw ownRoleError;
        if (active) setOwnRoleIds((ownAssignments ?? []).map((row) => row.role_id));
        await load();
      } catch (loadError) {
        if (active)
          setError(loadError instanceof Error ? loadError.message : "Role data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [load]);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;

  useEffect(() => {
    if (!selectedRole) {
      setName("");
      setDescription("");
      setSelectedPermissionIds([]);
      return;
    }
    setName(selectedRole.name);
    setDescription(selectedRole.description ?? "");
    setSelectedPermissionIds(
      assignments
        .filter((assignment) => assignment.role_id === selectedRole.id)
        .map((assignment) => assignment.permission_id),
    );
  }, [selectedRole, assignments]);

  const saveRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const normalizedName = name.trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,80}$/.test(normalizedName)) {
      setError(
        "Role name must be 2–80 characters and use lowercase English letters, numbers, hyphens, or underscores.",
      );
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (selectedRoleId) {
        const payload: TablesUpdate<"roles"> = {
          name: normalizedName,
          description: description.trim() || null,
        };
        const { error: updateError } = await supabase
          .from("roles")
          .update(payload)
          .eq("id", selectedRoleId);
        if (updateError) throw updateError;
      } else {
        const payload: TablesInsert<"roles"> = {
          name: normalizedName,
          description: description.trim() || null,
        };
        const { data, error: insertError } = await supabase
          .from("roles")
          .insert(payload)
          .select("id")
          .single();
        if (insertError) throw insertError;
        setSelectedRoleId(data.id);
      }
      await load();
      setMessage("Role saved.");
    } catch {
      setError("Could not save the role. Check for duplicate names and verify the RLS policy.");
    } finally {
      setSaving(false);
    }
  };

  const savePermissions = async () => {
    if (!supabase || !selectedRoleId) return;
    if (
      ownRoleIds.includes(selectedRoleId) &&
      !selectedPermissionIds.includes(
        permissions.find((permission) => permission.name === "roles.manage")?.id ?? "",
      )
    ) {
      setError(
        "You cannot remove roles.manage from your active role; doing so could lock you out.",
      );
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const currentIds = assignments
        .filter((assignment) => assignment.role_id === selectedRoleId)
        .map((assignment) => assignment.permission_id);
      const toRemove = currentIds.filter((id) => !selectedPermissionIds.includes(id));
      const toAdd = selectedPermissionIds.filter((id) => !currentIds.includes(id));

      // Remove revoked grants first: a later insert failure can under-grant access,
      // but it will not leave a permission that the administrator intended to revoke.
      if (toRemove.length) {
        const { error: deleteError } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", selectedRoleId)
          .in("permission_id", toRemove);
        if (deleteError) throw deleteError;
      }
      if (toAdd.length) {
        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(toAdd.map((permission_id) => ({ role_id: selectedRoleId, permission_id })));
        if (insertError) throw insertError;
      }
      await load();
      setMessage("Role permissions saved.");
    } catch {
      setError("Permission assignment did not complete. Reload and verify the current state.");
      try {
        await load();
      } catch {
        /* Keep the original error visible. */
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p role="status">Checking roles.manage permission…</p>;
  if (error && roles.length === 0)
    return (
      <section className="notice-card">
        <h1>Role Management</h1>
        <p role="alert">{error}</p>
        <Link to="/dashboard">Return to dashboard</Link>
      </section>
    );

  return (
    <section className="role-manager" aria-labelledby="role-manager-title">
      <p>
        <Link to="/dashboard">← Dashboard</Link>
      </p>
      <h1 id="role-manager-title">Role and Permission Management</h1>
      <p>
        This section is restricted to roles.manage. Role deletion is intentionally disabled in this preview
        to avoid breaking user assignments.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <div className="role-manager-layout">
        <nav className="role-list" aria-label="Role list">
          <button type="button" onClick={() => setSelectedRoleId("")}>
            + New role
          </button>
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              aria-current={role.id === selectedRoleId ? "true" : undefined}
              onClick={() => setSelectedRoleId(role.id)}
            >
              <strong>{role.name}</strong>
              {role.description ? <small>{role.description}</small> : null}
            </button>
          ))}
        </nav>
        <div className="role-editor">
          <form className="role-form" onSubmit={(event) => void saveRole(event)}>
            <h2>{selectedRole ? "Edit role" : "New role"}</h2>
            <label htmlFor="role-name">Role name</label>
            <input
              id="role-name"
              required
              maxLength={80}
              pattern="[a-z0-9_-]{2,80}"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <label htmlFor="role-description">Description</label>
            <textarea
              id="role-description"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save role"}
            </button>
          </form>
          {selectedRole ? (
            <section className="role-permissions" aria-labelledby="role-permissions-title">
              <h2 id="role-permissions-title">Permissions: {selectedRole.name}</h2>
              {permissions.map((permission) => (
                <label className="permission-option" key={permission.id}>
                  <input
                    type="checkbox"
                    checked={selectedPermissionIds.includes(permission.id)}
                    onChange={(event) =>
                      setSelectedPermissionIds((current) =>
                        event.target.checked
                          ? [...current, permission.id]
                          : current.filter((id) => id !== permission.id),
                      )
                    }
                  />
                  <span>
                    <strong>{permission.name}</strong>
                    {permission.description ? <small>{permission.description}</small> : null}
                  </span>
                </label>
              ))}
              <button type="button" disabled={saving} onClick={() => void savePermissions()}>
                {saving ? "Saving…" : "Save permissions"}
              </button>
            </section>
          ) : (
            <p>You can assign permissions after creating a role.</p>
          )}
        </div>
      </div>
    </section>
  );
}
