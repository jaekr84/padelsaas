import { getBookingsListAction } from "@/lib/actions/reservation-actions";
import { BookingsList } from "@/components/bookings-list";
import { Suspense } from "react";

export default async function BookingsPage(props: {
  params?: Promise<any>;
  searchParams?: Promise<any>;
}) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams?.date || undefined;

  // Fetch bookings for the selected date
  const bookings = await getBookingsListAction(dateParam);

  return (
    <div className="flex-1 space-y-6 p-6 bg-slate-50/50">
      {/* Header Industrial */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-6 bg-blue-800" />
            <h2 className="text-2xl font-black tracking-tighter text-slate-950 uppercase">Panel de Control</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Gestión Operativa y Auditoría de Recaudación
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sistema</span>
            <span className="text-xs font-black text-blue-800 uppercase">Estado: Activo</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Suspense fallback={
          <div className="h-96 flex items-center justify-center border border-slate-200 border-dashed bg-white">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-800 border-t-transparent animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando registros...</span>
            </div>
          </div>
        }>
          <BookingsList
            bookings={bookings}
            globalDate={dateParam}
          />
        </Suspense>
      </div>
    </div>
  );
}
