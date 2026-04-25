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
  LucidePlus,
  LucideRepeat,
  LucidePackage,
  LucideShoppingCart,
  LucideScanBarcode,
  LucideBox,
  LucideChevronLeft,
  LucideChevronRight,
  LucideMenu,
  LucideShieldAlert,
  LucideMonitor
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
  { title: "Reportes", icon: LucideLayoutDashboard, href: "/reports" },
  { title: "Punto de Venta", icon: LucideScanBarcode, href: "/sales" },
  { title: "Lista de Reservas", icon: LucideCalendar, href: "/bookings" },
  { title: "Reservas Fijas", icon: LucideRepeat, href: "/fixed-reservations" },
  { title: "Reservas Simples", icon: LucideDumbbell, href: "/courts" },
  { title: "Clientes (CRM)", icon: LucideUsers, href: "/customers" },
  { title: "Kiosco / Stock", icon: LucidePackage, href: "/inventory" },
  { title: "Compras", icon: LucideShoppingCart, href: "/purchases" },
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
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-slate-200 shadow-none bg-white">
      <SidebarHeader className="p-4 space-y-4">
        {/* Logo Terminal Area */}
        <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-950 text-white shadow-[4px_4px_0px_rgba(30,64,175,1)]">
            <LucideBox className="h-6 w-6" />
          </div>
          <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-black uppercase tracking-tighter text-slate-950 leading-none">Padel Industrial</span>
            <div className="flex items-center gap-1.5 mt-1">
              {isAdmin ? (
                <LucideShieldAlert className="h-2.5 w-2.5 text-blue-800" />
              ) : (
                <LucideMonitor className="h-2.5 w-2.5 text-slate-400" />
              )}
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isAdmin ? "Admin Console" : "Terminal Operativa"}
              </span>
            </div>
          </div>
        </div>

        {/* Center Switcher Container */}
        <div className="group-data-[collapsible=icon]:hidden px-1">
          <CenterSwitcher
            centers={centers}
            activeId={activeCenterId}
          />
        </div>

        {/* Mini Sidebar Trigger */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center pt-2">
          <SidebarTrigger className="h-10 w-10 border border-slate-100 hover:bg-slate-50 transition-all rounded-none">
            <LucideChevronRight className="h-4 w-4 text-slate-400" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 px-3 mb-4 group-data-[collapsible=icon]:hidden">
            Sistemas / Control
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className={cn(
                      "h-11 rounded-none transition-all duration-150 px-3 border-l-2",
                      "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:border-l-0",
                      pathname === item.href
                        ? "bg-slate-950 text-white border-l-blue-800 font-black shadow-lg shadow-blue-900/10"
                        : "text-slate-500 border-l-transparent hover:bg-slate-50 hover:text-slate-950 hover:border-l-slate-200"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0",
                      pathname === item.href ? "text-blue-400" : "text-slate-400 group-hover:text-slate-950"
                    )} />
                    <span className="ml-3 text-[10px] font-black uppercase tracking-widest group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="group-data-[collapsible=icon]:hidden">
          <UserNav />
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex justify-center">
          <div className="h-10 w-10 flex items-center justify-center border border-slate-200 bg-white">
            <LucideUsers className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </SidebarFooter>

      {/* Global Modals remain invisible triggers */}
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
