import React from "react";
import Link from "next/link";
import { LucideCheckCircle2, LucideArrowRight } from "lucide-react";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const paymentId = params.payment_id;
  const status = params.status;
  const bookingId = params.external_reference;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white border-4 border-slate-950 p-12 max-w-xl w-full text-center space-y-8 shadow-[16px_16px_0px_rgba(0,0,0,1)]">
        
        {/* Icono de Éxito */}
        <div className="relative inline-block">
          <div className="h-24 w-24 bg-emerald-500 text-white flex items-center justify-center rounded-full border-4 border-slate-950 mx-auto">
            <LucideCheckCircle2 className="h-12 w-12" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-yellow-400 border-4 border-slate-950 rounded-full flex items-center justify-center">
             <span className="text-xl">🎾</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
            Tu pago ha sido procesado con éxito. Ya puedes ver los detalles en tu perfil.
          </p>
        </div>

        {/* Detalles Técnicos Estilizados */}
        <div className="bg-slate-50 border-2 border-slate-950 p-6 space-y-3 text-left">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black uppercase text-slate-400">ID de Operación</span>
            <span className="text-xs font-bold tabular-nums">{paymentId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Estado</span>
            <span className="text-xs font-black uppercase text-emerald-600">{status}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400">Referencia</span>
            <span className="text-xs font-bold">{bookingId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4">
          <Link 
            href="/profile" 
            className="group flex items-center justify-center gap-3 px-8 py-5 bg-slate-950 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            Ir a mis Reservas
            <LucideArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href="/explore" 
            className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-950 tracking-[0.3em] transition-colors"
          >
            Reservar otra cancha
          </Link>
        </div>
      </div>
    </div>
  );
}
