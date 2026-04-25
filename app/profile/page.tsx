import React from "react";
import { getPlayerBookingsAction } from "@/lib/actions/public-booking";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  LucideCalendar, 
  LucideClock, 
  LucideMapPin, 
  LucideUser, 
  LucideActivity,
  LucideChevronRight,
  LucideTrophy,
  LucideBox
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const result = await getPlayerBookingsAction();
  const bookings = result.success ? result.data : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-800 selection:text-white">
      {/* Navbar */}
      <nav className="h-16 bg-white border-b-2 border-slate-950 px-6 flex items-center justify-between sticky top-0 z-50">
        <Link href="/explore" className="flex items-center gap-3">
          <div className="h-8 w-8 bg-slate-950 flex items-center justify-center text-white">
            <LucideBox className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Padel Industrial</span>
        </Link>
        <div className="flex items-center gap-4">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jugador:</span>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-950">{session.user?.name}</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Profile Header */}
        <div className="bg-white border-2 border-slate-950 p-10 flex flex-col md:flex-row gap-10 items-center">
           <div className="h-24 w-24 bg-slate-950 flex items-center justify-center text-white text-4xl font-black">
              {session.user?.name?.[0]}
           </div>
           <div className="space-y-4 flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="w-2 h-6 bg-blue-800" />
                <h1 className="text-3xl font-black uppercase tracking-tighter">Perfil de Operador</h1>
              </div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{session.user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                 <div className="px-3 py-1 bg-slate-100 border border-slate-200 text-[9px] font-black uppercase tracking-widest">Nivel: 4.5</div>
                 <div className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-[9px] font-black uppercase tracking-widest">Frecuente</div>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-slate-950 text-white p-4 text-center">
                 <span className="block text-[8px] font-black uppercase tracking-widest text-blue-500 mb-1">Partidos</span>
                 <span className="text-2xl font-black tabular-nums">{bookings.length}</span>
              </div>
              <div className="bg-blue-800 text-white p-4 text-center">
                 <span className="block text-[8px] font-black uppercase tracking-widest text-white/50 mb-1">Victorias</span>
                 <span className="text-2xl font-black tabular-nums">--</span>
              </div>
           </div>
        </div>

        {/* Bookings History */}
        <div className="space-y-6">
           <div className="flex items-center justify-between border-b-2 border-slate-950 pb-4">
              <div className="flex items-center gap-2">
                 <LucideCalendar className="h-5 w-5 text-blue-800" />
                 <h2 className="text-xl font-black uppercase tracking-tighter">Historial de Despliegues</h2>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Últimas {bookings.length} Entradas</span>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {bookings.map((booking: any) => (
                <div key={booking.id} className="bg-white border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-950 transition-colors group">
                   <div className="flex items-center gap-6">
                      <div className="h-12 w-12 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-800 group-hover:text-white transition-colors">
                         <LucideActivity className="h-6 w-6" />
                      </div>
                      <div>
                         <h4 className="font-black uppercase tracking-tight text-slate-950 text-lg leading-none mb-2">
                            {booking.court?.center?.name}
                         </h4>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                               <LucideMapPin className="h-3 w-3 text-blue-800" /> {booking.court?.center?.city}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4">
                               <LucideTrophy className="h-3 w-3 text-blue-800" /> {booking.court?.name}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="text-right">
                         <span className="block text-[8px] font-black uppercase tracking-widest text-slate-300">Fecha / Inicio</span>
                         <p className="text-[10px] font-black text-slate-950 uppercase tabular-nums">
                            {new Date(booking.startTime).toLocaleDateString()} - {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </div>
                      <div className="px-3 py-1 bg-slate-950 text-white text-[8px] font-black uppercase tracking-widest">
                         {booking.status}
                      </div>
                      <LucideChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-950 transition-colors hidden md:block" />
                   </div>
                </div>
              ))}

              {bookings.length === 0 && (
                <div className="py-20 text-center bg-white border-2 border-dashed border-slate-200 space-y-4">
                   <LucideBox className="h-12 w-12 mx-auto text-slate-200" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No se detectaron misiones previas</p>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}
