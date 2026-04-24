import { getBookingsListAction } from "@/lib/actions/reservation-actions";
import { getCourtsAction } from "@/lib/actions/court";
import { getCenterAction } from "@/lib/actions/center";
import { BookingsList } from "@/components/bookings-list";
import { CourtsList } from "@/components/courts-list";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../src/components/ui/tabs";
import { LucideLayoutGrid, LucideList } from "lucide-react";

export default async function BookingsPage(props: {
  params?: Promise<any>;
  searchParams?: Promise<any>;
}) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams?.date || undefined;

  // Parallel data fetching for performance
  const [bookings, courts, center] = await Promise.all([
    getBookingsListAction(dateParam),
    getCourtsAction(dateParam),
    getCenterAction()
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-slate-50/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Panel de Control</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            Gestión operativa y auditoría de recaudación diaria
          </p>
        </div>
      </div>

      <Tabs defaultValue="grid" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-200/50 p-1 rounded-xl">
            <TabsTrigger value="grid" className="rounded-lg gap-2 font-bold uppercase text-[10px] data-selected:bg-white data-selected:text-emerald-700 shadow-sm transition-all">
              <LucideLayoutGrid className="h-3.5 w-3.5" />
              Vista Grilla
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-lg gap-2 font-bold uppercase text-[10px] data-selected:bg-white data-selected:text-emerald-700 shadow-sm transition-all">
              <LucideList className="h-3.5 w-3.5" />
              Historial de Caja
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="mt-0 border-none p-0 outline-none">
          <Suspense fallback={<div className="h-96 flex items-center justify-center font-bold uppercase text-slate-400 animate-pulse">Cargando Grilla Operativa...</div>}>
            <CourtsList
              courts={courts}
              center={center}
              globalDate={dateParam}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="list" className="mt-0 border-none p-0 outline-none">
          <Suspense fallback={<div className="h-96 flex items-center justify-center font-bold uppercase text-slate-400 animate-pulse">Cargando Listado de Reservas...</div>}>
            <BookingsList
              bookings={bookings}
              globalDate={dateParam}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
