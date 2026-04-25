"use client";

import { useSession, signOut } from "next-auth/react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar";
import { LucideLogOut, LucideUser, LucideChevronUp, LucideUserCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function UserNav() {
  const { data: session } = useSession();
  
  const user = session?.user;
  const initials = user?.name?.split(" ").map(n => n[0]).join("") || "??";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <SidebarMenuButton 
                size="lg" 
                className="h-14 rounded-none border border-slate-200 bg-white hover:bg-slate-50 transition-all data-[state=open]:bg-slate-50 shadow-sm"
            >
              <Avatar className="h-9 w-9 rounded-none bg-slate-950 text-white shadow-md">
                <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                <AvatarFallback className="rounded-none font-black text-xs">{initials.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden ml-2">
                <span className="truncate text-[10px] font-black uppercase tracking-widest text-slate-950 leading-tight">{user?.name}</span>
                <span className="truncate text-[9px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">{user?.email}</span>
              </div>
              <LucideChevronUp className="ml-auto h-3 w-3 text-slate-400 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          } />
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-none border-slate-200 p-0 shadow-2xl bg-white"
            side="top"
            align="end"
            sideOffset={8}
          >
            <div className="bg-slate-950 p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <LucideUserCheck className="h-20 w-20" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <Avatar className="h-12 w-12 rounded-none border-2 border-blue-800 shadow-xl">
                        <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                        <AvatarFallback className="rounded-none bg-blue-800 font-black text-sm">{initials.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left">
                        <span className="truncate text-xs font-black uppercase tracking-[0.2em]">{user?.name}</span>
                        <span className="truncate text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user?.email}</span>
                    </div>
                </div>
            </div>
            
            <div className="p-2 bg-white">
                <DropdownMenuGroup>
                    <DropdownMenuItem 
                        className="rounded-none py-3 px-4 text-[10px] font-black uppercase tracking-widest cursor-pointer focus:bg-slate-50 focus:text-blue-800 transition-colors" 
                        render={<Link href="/account" />}
                    >
                        <LucideUser className="mr-3 h-4 w-4" />
                        Perfil del Operador
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-100 mx-2" />
                <DropdownMenuItem 
                    className="rounded-none py-3 px-4 text-[10px] font-black uppercase tracking-widest text-red-600 focus:text-white focus:bg-red-600 cursor-pointer transition-colors"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LucideLogOut className="mr-3 h-4 w-4" />
                    Finalizar Sesión
                </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
