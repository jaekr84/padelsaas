import React from "react";
import { LucideAlertCircle, LucideArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BookingFailurePage() {
  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white border-2 border-slate-950 shadow-[8px_8px_0px_black] text-center space-y-8">
      <div className="h-20 w-20 bg-red-600 text-white flex items-center justify-center mx-auto">
        <LucideAlertCircle className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Error en el Pago</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No pudimos procesar tu transacción</p>
      </div>
      <div className="p-4 bg-red-50 border border-red-100 text-left text-[10px] font-bold uppercase text-red-600">
        Tu reserva sigue pendiente. Intenta realizar el pago nuevamente o contacta al soporte técnico si el problema persiste.
      </div>
      <Link href="/explore">
        <Button className="w-full h-14 bg-slate-950 text-white rounded-none font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-3">
          <LucideArrowLeft className="h-5 w-5" /> Volver al Inicio
        </Button>
      </Link>
    </div>
  );
}
