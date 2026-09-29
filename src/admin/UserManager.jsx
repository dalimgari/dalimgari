import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PERMISSIONS = [
  { key: "media_upload", label: "Upload Media" },
  { key: "media_delete", label: "Delete Media" }
];

function getMonthKey(date) {
  return date.toISOString().slice(0, 7);
}

function getLastMonths(count) {
  const result = [];
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - index,
      1
    );

    result.push({
      key: getMonthKey(date),
      label: date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short"
      })
    });
  }

  return result;
}

export default function UserManager({ onBack }) {
  const [users, setUsers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    setMessage("");

    const [usersResult, visitsResult] = await Promise.all([
      supabase.from("UserInformation").select("*").eq("record_type", "user"),
      supabase
        .from("UserInformation")
        .select(
          "id, visitor_id, user_id, visited_at, page_path, referrer, device_type, browser, operating_system, language, timezone, screen_width, screen_height, is_returning"
        )
        .order("visited_at", { ascending: false })
        .limit(5000)
    ]);

    if (usersResult.error) {
      setError(usersResult.error.message);
      setLoading(false);
      return;
    }

    if (visitsResult.error) {
      setError(visitsResult.error.message);
      setLoading(false);
      return;
    }

    setUsers(usersResult.data || []);
    setVisits(visitsResult.data || []);
    setLoading(false);
  }

  async function changeRole(userId, role) {
    setSaving(`${userId}:role`);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("UserInformation")
      .update({ role })
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
      setSaving("");
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? { ...user, role } : user
      )
    );

    setSelectedUser((current) =>
      current?.id === userId
        ? { ...current, role }
        : current
    );

    setMessage("Role updated.");
    setSaving("");
  }

  async function togglePermission(userId, permission) {
    const user = users.find((item) => item.id === userId);

    if (!user) return;

    const enabled = (user.permissions || []).includes(permission);

    setSaving(`${userId}:${permission}`);
    setError("");
    setMessage("");

    const result = enabled
      ? await supabase
          .from("UserInformation")
          .delete()
          .eq("user_id", userId)
          .eq("permission", permission)
      : await supabase
          .from("UserInformation")
          .insert({
            user_id: userId,
            permission
          });

    if (result.error) {
      setError(result.error.message);
      setSaving("");
      return;
    }

    const nextPermissions = enabled
      ? (user.permissions || []).filter(
          (item) => item !== permission
        )
      : [...(user.permissions || []), permission];

    setUsers((current) =>
      current.map((item) =>
        item.id === userId
          ? { ...item, permissions: nextPermissions }
          : item
      )
    );

    setSelectedUser((current) =>
      current?.id === userId
        ? { ...current, permissions: nextPermissions }
        : current
    );

    setMessage("Permission updated.");
    setSaving("");
  }

  const months = useMemo(() => getLastMonths(6), []);

  const monthlyStats = useMemo(() => {
    return months.map((month) => {
      const rows = visits.filter(
        (visit) => getMonthKey(new Date(visit.visited_at)) === month.key
      );

      const visitors = new Set(
        rows
          .map((visit) => visit.visitor_id)
          .filter(Boolean)
      );

      return {
        ...month,
        visits: rows.length,
        visitors: visitors.size
      };
    });
  }, [months, visits]);

  const deviceStats = useMemo(() => {
    const map = {};

    visits.forEach((visit) => {
      const key = visit.device_type || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [visits]);

  const operatingSystemStats = useMemo(() => {
    const map = {};

    visits.forEach((visit) => {
      const key = visit.operating_system || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [visits]);

  const languageStats = useMemo(() => {
    const map = {};

    visits.forEach((visit) => {
      const key = visit.language || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [visits]);

  const timezoneStats = useMemo(() => {
    const map = {};

    visits.forEach((visit) => {
      const key = visit.timezone || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [visits]);

  const pageStats = useMemo(() => {
    const map = {};

    visits.forEach((visit) => {
      const key = visit.page_path || "/";
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [visits]);

  const browserStats = useMemo(() => {
    const map = {};

    visits.forEach((visit) => {
      const key = visit.browser || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [visits]);

  const returningVisitors = visits.filter(
    (visit) => visit.is_returning
  ).length;

  const uniqueVisitors = new Set(
    visits.map((visit) => visit.visitor_id).filter(Boolean)
  ).size;

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1>User Information</h1>
        </div>

        <div className="admin-header-actions">
          <button type="button" onClick={onBack}>
            Dashboard
          </button>

          <button type="button" onClick={loadData}>
            Refresh
          </button>
        </div>
      </header>

      <section className="admin-content">
        {message && <p>{message}</p>}
        {error && <p className="manager-error">{error}</p>}

        {loading ? (
          <div className="admin-loading">Loading user information...</div>
        ) : (
          <>
            <div className="admin-grid">
              <div className="admin-welcome">
                <h2>Total Visits</h2>
                <strong>{visits.length}</strong>
              </div>

              <div className="admin-welcome">
                <h2>Unique Visitors</h2>
                <strong>{uniqueVisitors}</strong>
              </div>

              <div className="admin-welcome">
                <h2>Returning Visits</h2>
                <strong>{returningVisitors}</strong>
              </div>

              <div className="admin-welcome">
                <h2>Registered Users</h2>
                <strong>{users.length}</strong>
              </div>
            </div>

            <section className="admin-content">
              <h2>Monthly Visitors</h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Visits</th>
                      <th>Unique Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.map((item) => (
                      <tr key={item.key}>
                        <td>{item.label}</td>
                        <td>{item.visits}</td>
                        <td>{item.visitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-content">
              <h2>Visitor Devices</h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceStats.map(([name, count]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-content">
              <h2>Operating Systems</h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Operating System</th>
                      <th>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operatingSystemStats.map(([name, count]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-content">
              <h2>Visitor Languages</h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Language</th>
                      <th>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languageStats.map(([name, count]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-content">
              <h2>Visitor Timezones</h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timezone</th>
                      <th>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timezoneStats.map(([name, count]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-content">
              <h2>Most Visited Pages</h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageStats.map(([name, count]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-content">
              <h2>Visitor Browsers</h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Browser</th>
                      <th>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {browserStats.map(([name, count]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-content">
              <h2>Registered Users</h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Age</th>
                      <th>Date of Birth</th>
                      <th>Role</th>
                      <th>Account Created</th>
                      <th>Permissions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{user.full_name || "Unnamed user"}</td>
                        <td>{user.email || "—"}</td>
                        <td>{user.phone || "—"}</td>
                        <td>{user.age ?? "—"}</td>
                        <td>{user.date_of_birth || "—"}</td>
                        <td>{user.role || "user"}</td>
                        <td>
                          {user.created_at
                            ? new Date(
                                user.created_at
                              ).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          {(user.permissions || []).length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedUser && (
              <section className="admin-content">
                <div className="admin-header">
                  <div>
                    <p className="admin-eyebrow">
                      User Details
                    </p>
                    <h2>
                      {selectedUser.full_name ||
                        selectedUser.email ||
                        "User"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <tbody>
                      <tr>
                        <th>Email</th>
                        <td>{selectedUser.email || "—"}</td>
                      </tr>
                      <tr>
                        <th>Phone</th>
                        <td>{selectedUser.phone || "—"}</td>
                      </tr>
                      <tr>
                        <th>Name</th>
                        <td>{selectedUser.full_name || "—"}</td>
                      </tr>
                      <tr>
                        <th>Age</th>
                        <td>{selectedUser.age ?? "—"}</td>
                      </tr>
                      <tr>
                        <th>Date of Birth</th>
                        <td>{selectedUser.date_of_birth || "—"}</td>
                      </tr>
                      <tr>
                        <th>Account Created</th>
                        <td>
                          {selectedUser.created_at
                            ? new Date(
                                selectedUser.created_at
                              ).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                      <tr>
                        <th>Password</th>
                        <td>Protected by authentication system</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3>Role</h3>

                <select
                  value={selectedUser.role || "user"}
                  disabled={
                    saving === `${selectedUser.id}:role`
                  }
                  onChange={(event) =>
                    changeRole(
                      selectedUser.id,
                      event.target.value
                    )
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>

                <h3>Permissions</h3>

                {PERMISSIONS.map((permission) => (
                  <label key={permission.key}>
                    <input
                      type="checkbox"
                      checked={(
                        selectedUser.permissions || []
                      ).includes(permission.key)}
                      disabled={
                        saving ===
                        `${selectedUser.id}:${permission.key}`
                      }
                      onChange={() =>
                        togglePermission(
                          selectedUser.id,
                          permission.key
                        )
                      }
                    />
                    {permission.label}
                  </label>
                ))}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
