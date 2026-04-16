"use client";

import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { 
  LucideLayoutDashboard, 
  LucideHome, 
  LucideSettings, 
  LucideUsers, 
  LucideDumbbell,
  LucideCalendar
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { CenterSwitcher } from "@/components/center-switcher";
import { getCentersAction } from "@/lib/actions/center";
import { useEffect, useState } from "react";

const navItems = [
  { title: "Home", icon: LucideHome, href: "/home" },
  { title: "Reservas", icon: LucideCalendar, href: "/bookings" },
  { title: "Canchas", icon: LucideDumbbell, href: "/courts" },
  { title: "Jugadores", icon: LucideUsers, href: "/players" },
  { title: "Usuarios", icon: LucideUsers, href: "/users", adminOnly: true },
  { title: "Configuración", icon: LucideSettings, href: "/settings", adminOnly: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [centers, setCenters] = useState<any[]>([]);
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    async function loadCenters() {
      try {
        const data = await getCentersAction();
        setCenters(data);
      } catch (error) {
        console.error("Error loading centers:", error);
      }
    }
    if (session?.user?.id) {
      loadCenters();
    }
  }, [session]);

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LucideDumbbell className="h-5 w-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold uppercase tracking-wider">Padel SaaS</span>
            <span className="truncate text-xs text-muted-foreground">{isAdmin ? "Admin Portal" : "Mostrador Portal"}</span>
          </div>
        </div>
        <CenterSwitcher 
          centers={centers} 
          activeId={(session?.user as any)?.centerId} 
        />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
