import { listUsers } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AddUserForm } from "@/components/AddUserForm";
import { UserRoleSelect } from "@/components/UserRoleSelect";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { isFixedSuperAdmin } from "@/lib/super-admins";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = getSession();
  const users = await listUsers();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-ink">Users</h2>
        <AddUserForm />
      </div>
      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
              const isSelf = u.id === session?.userId;
              const isFixed = isFixedSuperAdmin(u.email);
              const locked = isSelf || isFixed;
              return (
                <tr key={u.id} className="transition hover:bg-paper/50">
                  <td className="px-4 py-4 text-ink">
                    {u.name}
                    {isSelf && <span className="ml-1 text-xs text-slate">(you)</span>}
                    {!isSelf && isFixed && (
                      <span className="ml-1 text-xs text-slate">(fixed admin)</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate">{u.email}</td>
                  <td className="px-4 py-4">
                    <UserRoleSelect userId={u.id} role={u.role} disabled={locked} />
                  </td>
                  <td className="px-4 py-4 text-slate">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <DeleteUserButton userId={u.id} disabled={locked} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
