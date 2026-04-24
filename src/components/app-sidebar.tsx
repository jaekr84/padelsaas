"use client";

import { cn } from "@/lib/utils";

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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  LucideLayoutDashboard, 
  LucideHome, 
  LucideSettings, 
  LucideUsers, 
  LucideDumbbell,
  LucideCalendar,
  LucidePlusCircle,
  LucidePlus
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { CenterSwitcher } from "@/components/center-switcher";
import { getCentersAction } from "@/lib/actions/center";
import { getCourtsAction } from "@/lib/actions/court";
import { useEffect, useState } from "react";
import { ManualReservationSheet } from "./manual-reservation-sheet";
import { Button } from "./ui/button";

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
  const [courts, setCourts] = useState<any[]>([]);
  const [activeCenter, setActiveCenter] = useState<any>(null);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  
  const isAdmin = session?.user?.role === "admin";
  const activeCenterId = activeCenter?.id;

  useEffect(() => {
    async function loadData() {
      try {
        const [centersData, currentCenter] = await Promise.all([
          getCentersAction(),
          import("@/lib/actions/center").then(m => m.getCenterAction())
        ]);
        setCenters(centersData);
        if (currentCenter) {
          setActiveCenter(currentCenter);
        } else if (centersData.length > 0) {
          // Fallback to the main branch (first created) if absolutely no context
          setActiveCenter(centersData[0]);
        }
      } catch (error) {
        console.error("Error loading center data:", error);
      }
    }
    if (session?.user?.id) {
      loadData();
    }
  }, [session]);

  useEffect(() => {
    async function loadCourts() {
      try {
        const data = await getCourtsAction();
        setCourts(data);
      } catch (error) {
        console.error("Error loading courts:", error);
      }
    }
    if (activeCenterId) {
      loadCourts();
    }
  }, [activeCenterId]);

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-2 space-y-4">
        {/* Logo and Trigger Section */}
        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <LucideDumbbell className="h-5 w-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-3">
            <span className="truncate font-black uppercase tracking-wider text-slate-800">Padel SaaS</span>
            <span className="truncate text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{isAdmin ? "Admin Portal" : "Mostrador"}</span>
          </div>
          <SidebarTrigger className="h-8 w-8 hover:bg-slate-100 rounded-lg group-data-[collapsible=icon]:hidden" />
        </div>

        {/* Action Button - Nueva Reserva */}
        <div className="px-2 flex justify-center">
          <Button 
            onClick={() => setIsResModalOpen(true)}
            className={cn(
              "bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-600/10 font-bold uppercase tracking-widest transition-all active:scale-95",
              "group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-full",
              "w-full h-11 rounded-xl text-[10px] gap-2 flex items-center justify-center"
            )}
          >
            <LucidePlus className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden">Nueva Reserva</span>
          </Button>
        </div>

        {/* Center Switcher - ONLY VISIBLE WHEN EXPANDED */}
        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <CenterSwitcher 
            centers={centers} 
            activeId={activeCenterId} 
          />
        </div>

        {/* Expand/Collapse Trigger for Mini-Sidebar */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center border-t pt-4 border-slate-100">
          <SidebarTrigger className="h-10 w-10 hover:bg-slate-100 rounded-xl" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 px-4 mb-2 group-data-[collapsible=icon]:hidden">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className={cn(
                      "h-12 rounded-xl transition-all duration-200",
                      "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:mx-auto",
                      pathname === item.href 
                        ? "bg-emerald-50 text-emerald-700 font-bold" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                      !isAdmin && "px-4"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform shrink-0", 
                      pathname === item.href && "scale-110"
                    )} />
                    <span className="ml-3 group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-slate-100">
        <UserNav />
      </SidebarFooter>

      {/* Global Modal */}
      <ManualReservationSheet 
        open={isResModalOpen}
        onOpenChange={setIsResModalOpen}
        centerId={activeCenterId}
        center={activeCenter}
        courts={courts}
        initialSlot={null}
        openTime={activeCenter?.openTime}
        closeTime={activeCenter?.closeTime}
      />
    </Sidebar>
  );
}
