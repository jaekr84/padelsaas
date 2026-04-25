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
  
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/home");
  }

  const members = await getTenantMembersAction();

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-6 bg-slate-950" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-950">Módulo de Capital Humano</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">Gestión de Personal</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-2xl">
            Administración de accesos, roles operativos y asignación de sedes para el equipo de trabajo.
          </p>
        </div>
        <AddUserDialog />
      </div>
      
      <div className="bg-white border border-slate-200 overflow-hidden">
        <UsersList members={members} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
