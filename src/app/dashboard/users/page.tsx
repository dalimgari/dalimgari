import { requireAdmin } from "@/lib/auth/require-admin";
import { UserManagement } from "./user-management";

export const metadata = { title: "User Management" };
export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
  await requireAdmin();
  return (
    <section>
      <p className="eyebrow">Access control</p>
      <h1>User Management</h1>
      <p className="lead">Manage Member accounts and administrator access. The Edge Function enforces Super Admin protections independently of this interface.</p>
      <UserManagement />
    </section>
  );
}
