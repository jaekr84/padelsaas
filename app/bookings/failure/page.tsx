import React from "react";
import Link from "next/link";
import { LucideAlertCircle, LucideRefreshCcw, LucideArrowLeft } from "lucide-react";

export default async function BookingFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const status = params.status;
  const bookingId = (params.bookingId || params.external_reference) as string;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white border-4 border-slate-950 p-12 max-w-xl w-full text-center space-y-8 shadow-[16px_16px_0px_rgba(220,38,38,1)]">
        
        {/* Icono de Error */}
        <div className="relative inline-block">
          <div className="h-24 w-24 bg-red-600 text-white flex items-center justify-center rounded-full border-4 border-slate-950 mx-auto">
            <LucideAlertCircle className="h-12 w-12" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-yellow-400 border-4 border-slate-950 rounded-full flex items-center justify-center">
             <span className="text-xl">⚠️</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            Pago Rechazado
          </h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
            Lo sentimos, hubo un problema al procesar tu pago. No se ha realizado ningún cargo en tu cuenta.
          </p>
        </div>

        {/* Detalles Técnicos */}
        <div className="bg-red-50 border-2 border-slate-950 p-6 space-y-3 text-left">
          <div className="flex justify-between items-center border-b border-red-200 pb-2">
            <span className="text-[10px] font-black uppercase text-red-400">Estado MP</span>
            <span className="text-xs font-black uppercase text-red-600">{status || 'REJECTED'}</span>
          </div>
          <p className="text-[9px] font-bold text-red-800 uppercase leading-relaxed italic">
            * Esto puede deberse a falta de fondos, tarjeta bloqueada o rechazo del banco.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4">
          {bookingId && (
            <Link 
              href={`/bookings/${bookingId}/pay`} 
              className="group flex items-center justify-center gap-3 px-8 py-5 bg-slate-950 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all hover:-translate-y-1 active:translate-y-0 shadow-[6px_6px_0px_rgba(220,38,38,1)]"
            >
              <LucideRefreshCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              Intentar nuevamente
            </Link>
          )}
          
          <Link 
            href="/profile" 
            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-950 tracking-[0.3em] transition-colors"
          >
            <LucideArrowLeft className="h-3 w-3" />
            Volver a mi historial
          </Link>
        </div>
      </div>
    </div>
  );
}
