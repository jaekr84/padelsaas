"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  LucideUserCircle, 
  LucideTrash2, 
  LucideShieldCheck, 
  LucideMonitor,
  LucideMoreVertical,
  LucideChevronRight,
  LucideUser,
  LucideCalendar,
  LucideMapPin
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { deleteMemberAction, updateMemberRoleAction } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  role: string;
  createdAt: Date;
  userId: string;
  user: {
    name: string | null;
    email: string | null;
  };
  center: {
    name: string;
  } | null;
}

export function UsersList({ members, currentUserId }: { members: any[], currentUserId?: string }) {
  const handleDelete = async (id: string) => {
    if (!confirm("¿ESTÁ SEGURO DE ELIMINAR ESTE ACCESO? ESTA ACCIÓN ES IRREVERSIBLE.")) return;
    try {
      await deleteMemberAction(id);
      toast.success("ACCESO REVOCADO");
    } catch (error: any) {
      toast.error(error.message || "ERROR EN OPERACIÓN");
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await updateMemberRoleAction(id, newRole);
      toast.success("PRIVILEGIOS ACTUALIZADOS");
    } catch (error: any) {
      toast.error(error.message || "ERROR EN OPERACIÓN");
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-100 hover:bg-slate-100 border-b border-slate-200">
          <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identidad / Perfil</TableHead>
          <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nivel de Acceso</TableHead>
          <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Asignación Operativa</TableHead>
          <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Alta en Sistema</TableHead>
          <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id} className="group border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-none bg-slate-950 text-white shadow-md">
                  <LucideUser className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-tight text-slate-950">{member.user.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums">{member.user.email}</span>
                </div>
              </div>
            </TableCell>
            <TableCell className="px-6 py-4">
              {member.role === "admin" ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 w-fit">
                  <LucideShieldCheck className="h-3 w-3 text-blue-800" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-800">Administrador</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 w-fit">
                  <LucideMonitor className="h-3 w-3 text-slate-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Operador / Mostrador</span>
                </div>
              )}
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-2">
                <LucideMapPin className="h-3 w-3 text-slate-300" />
                {member.center ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{member.center.name}</span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-100">Acceso Global</span>
                )}
              </div>
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-2 text-slate-500">
                <LucideCalendar className="h-3 w-3" />
                <span className="text-[10px] font-bold tabular-nums uppercase">{formatDate(member.createdAt)}</span>
              </div>
            </TableCell>
            <TableCell className="px-6 py-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-slate-100">
                    <LucideMoreVertical className="h-4 w-4 text-slate-400" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="rounded-none border-slate-200">
                  <DropdownMenuItem
                    className="text-[10px] font-black uppercase tracking-widest cursor-pointer"
                    onClick={() => handleRoleChange(member.id, member.role === "admin" ? "mostrador" : "admin")}
                  >
                    Cambiar Privilegios
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-[10px] font-black uppercase tracking-widest text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    disabled={member.userId === currentUserId}
                    onClick={() => handleDelete(member.id)}
                  >
                    Revocar Acceso
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
