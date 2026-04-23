import { AdminShell } from "@/modules/admin/components";
import { requireServerUser } from "@/modules/core/auth/server";
import { QueryProvider } from "@/modules/core/orpc";

// Redirects unauthenticated users to /login (middleware handles /api/auth only).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireServerUser();
  return (
    <QueryProvider>
      <AdminShell
        user={{ id: user.id, name: user.name, email: user.email }}
      >
        {children}
      </AdminShell>
    </QueryProvider>
  );
}
