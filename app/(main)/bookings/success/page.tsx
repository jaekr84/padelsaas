import React from "react";
import { LucideCheckCircle2, LucideArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BookingSuccessPage() {
  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white border-2 border-slate-950 shadow-[8px_8px_0px_black] text-center space-y-8">
      <div className="h-20 w-20 bg-blue-800 text-white flex items-center justify-center mx-auto">
        <LucideCheckCircle2 className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter">¡Pago Confirmado!</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Tu reserva ha sido confirmada exitosamente</p>
      </div>
      <div className="p-4 bg-slate-50 border border-slate-200 text-left text-[10px] font-bold uppercase">
        Pronto recibirás un correo electrónico con los detalles del acceso y el código de ingreso al complejo.
      </div>
      <Link href="/explore">
        <Button className="w-full h-14 bg-slate-950 text-white rounded-none font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center justify-center gap-3">
          Explorar Más Canchas <LucideArrowRight className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}
