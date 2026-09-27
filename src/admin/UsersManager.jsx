import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const PERMISSIONS = [
  { key: "media_upload", label: "Upload Media" },
  { key: "media_delete", label: "Delete Media" }
];

export default function UsersManager({ onBack }) {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      setError(profilesError.message);
      setLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      setError(rolesError.message);
      setLoading(false);
      return;
    }

    const { data: permissionRows, error: permissionsError } = await supabase
      .from("user_permissions")
      .select("user_id, permission");

    if (permissionsError) {
      setError(permissionsError.message);
      setLoading(false);
      return;
    }

    const roleMap = {};

    (roles || []).forEach((item) => {
      roleMap[item.user_id] = item.role;
    });

    const permissionMap = {};

    (permissionRows || []).forEach((item) => {
      if (!permissionMap[item.user_id]) {
        permissionMap[item.user_id] = [];
      }

      permissionMap[item.user_id].push(item.permission);
    });

    setUsers(
      (profiles || []).map((profile) => ({
        ...profile,
        role: roleMap[profile.id] || "user"
      }))
    );

    setPermissions(permissionMap);
    setLoading(false);
  }

  function hasPermission(userId, permission) {
    return permissions[userId]?.includes(permission) || false;
  }

  async function togglePermission(userId, permission) {
    setSaving(`${userId}:${permission}`);
    setMessage("");
    setError("");

    const enabled = hasPermission(userId, permission);

    if (enabled) {
      const { error: deleteError } = await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", userId)
        .eq("permission", permission);

      if (deleteError) {
        setError(deleteError.message);
        setSaving("");
        return;
      }

      setPermissions((current) => ({
        ...current,
        [userId]: (current[userId] || []).filter(
          (item) => item !== permission
        )
      }));
    } else {
      const { error: insertError } = await supabase
        .from("user_permissions")
        .insert({
          user_id: userId,
          permission
        });

      if (insertError) {
        setError(insertError.message);
        setSaving("");
        return;
      }

      setPermissions((current) => ({
        ...current,
        [userId]: [...(current[userId] || []), permission]
      }));
    }

    setMessage("Permission updated.");
    setSaving("");
  }

  async function changeRole(userId, role) {
    setSaving(`${userId}:role`);
    setMessage("");
    setError("");

    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role })
      .eq("user_id", userId);

    if (roleError) {
      setError(roleError.message);
      setSaving("");
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? { ...user, role } : user
      )
    );

    setMessage("Role updated.");
    setSaving("");
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1>Users & Permissions</h1>
        </div>

        <div className="admin-header-actions">
          <button type="button" onClick={onBack}>
            Dashboard
          </button>
        </div>
      </header>

      <section className="admin-content">
        {message && <p>{message}</p>}
        {error && <p className="manager-error">{error}</p>}

        {loading ? (
          <div className="admin-loading">Loading users...</div>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Role</th>
                  {PERMISSIONS.map((permission) => (
                    <th key={permission.key}>
                      {permission.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>
                        {user.full_name || "Unnamed user"}
                      </strong>
                    </td>

                    <td>{user.phone || "—"}</td>

                    <td>
                      <select
                        value={user.role}
                        disabled={saving === `${user.id}:role`}
                        onChange={(event) =>
                          changeRole(
                            user.id,
                            event.target.value
                          )
                        }
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {PERMISSIONS.map((permission) => (
                      <td key={permission.key}>
                        <input
                          type="checkbox"
                          checked={hasPermission(
                            user.id,
                            permission.key
                          )}
                          disabled={
                            saving ===
                            `${user.id}:${permission.key}`
                          }
                          onChange={() =>
                            togglePermission(
                              user.id,
                              permission.key
                            )
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button type="button" onClick={loadUsers}>
          Refresh Users
        </button>
      </section>
    </main>
  );
}
