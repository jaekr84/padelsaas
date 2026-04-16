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
  LucideMoreVertical
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

interface Member {
  id: string;
  role: string;
  createdAt: Date;
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
    if (!confirm("¿Estás seguro de eliminar a este usuario de tu club?")) return;
    try {
      await deleteMemberAction(id);
      toast.success("Usuario eliminado");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await updateMemberRoleAction(id, newRole);
      toast.success("Rol actualizado");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar");
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Sede</TableHead>
            <TableHead>Fecha de Alta</TableHead>
            <TableHead className="w-[100px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <LucideUserCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{member.user.name}</span>
                    <span className="text-xs text-muted-foreground">{member.user.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {member.role === "admin" ? (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1 capitalize">
                    <LucideShieldCheck className="h-3 w-3" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1 capitalize">
                    <LucideMonitor className="h-3 w-3" />
                    Mostrador
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {member.center ? (
                  <span className="text-sm font-medium">{member.center.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Todas (Dueño)</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(member.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon">
                      <LucideMoreVertical className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.id, member.role === "admin" ? "mostrador" : "admin")}
                    >
                      Cambiar a {member.role === "admin" ? "Mostrador" : "Admin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      disabled={member.userId === currentUserId}
                      onClick={() => handleDelete(member.id)}
                    >
                      <LucideTrash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
