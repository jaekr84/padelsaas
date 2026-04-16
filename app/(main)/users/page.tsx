import { auth } from "@/auth";
import { getTenantMembersAction } from "@/lib/actions/user";
import { UsersList } from "@/components/users-list";
import { AddUserDialog } from "@/components/add-user-dialog";
import { redirect } from "next/navigation";

export default async function UsersPage(props: {
  params?: Promise<any>;
  searchParams?: Promise<any>;
}) {
  const session = await auth();
  
  // Protect route
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/home");
  }

  const members = await getTenantMembersAction();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Personal</h2>
          <p className="text-muted-foreground">
            Gestiona los accesos y roles de los empleados de tu club.
          </p>
        </div>
        <AddUserDialog />
      </div>
      
      <div className="pt-4">
        <UsersList members={members} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
