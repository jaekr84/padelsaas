"use client";

import React, { useState, useEffect } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { LucideCheckCircle2, LucideAlertCircle, LucideLoader2, LucideBox } from "lucide-react";
import { createBookingPreferenceAction } from "@/lib/actions/payments";
import Link from "next/link";

interface PaymentContinueProps {
  bookingId: string;
  publicKey: string;
  totalPrice: number;
  centerName: string;
}

export function PaymentContinue({ bookingId, publicKey, totalPrice, centerName }: PaymentContinueProps) {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [initPoint, setInitPoint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initPayment() {
      try {
        initMercadoPago(publicKey);
        const res = await createBookingPreferenceAction(bookingId);
        if (res.success && res.preferenceId) {
          setPreferenceId(res.preferenceId);
          setInitPoint(res.initPoint || null);
        } else {
          setError(res.error || "No se pudo generar el botón de pago");
        }
      } catch (err) {
        console.error("Error initializing payment:", err);
        setError("Error de conexión con Mercado Pago");
      } finally {
        setLoading(false);
      }
    }
    initPayment();
  }, [bookingId, publicKey]);

  const minPayment = Math.ceil(totalPrice * 0.5);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <LucideLoader2 className="h-10 w-10 text-blue-800 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center px-6">
          Preparando tu transacción segura...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-red-600 p-12 text-center space-y-6">
        <div className="h-16 w-16 bg-red-100 text-red-600 flex items-center justify-center mx-auto rounded-full">
          <LucideAlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-red-600">Algo salió mal</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
            {error}
          </p>
        </div>
        <Link href="/profile" className="inline-block px-8 py-4 bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-colors">
          Volver a mi Perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-slate-950 p-10 space-y-8 max-w-2xl mx-auto shadow-[12px_12px_0px_black]">
      <div className="flex items-center gap-4 border-b-2 border-slate-950 pb-6">
        <div className="h-14 w-14 bg-blue-800 text-white flex items-center justify-center shrink-0 shadow-[4px_4px_0px_black]">
          <LucideBox className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">{centerName}</h2>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em]">Continuar con el pago de reserva</p>
        </div>
      </div>

      <div className="bg-slate-50 border-2 border-slate-950 p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-slate-200 pb-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total de la Reserva</span>
            <span className="text-xl font-black tabular-nums">$ {totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-end border-b border-slate-200 pb-3">
            <span className="text-[10px] font-black uppercase text-blue-800 tracking-widest">Mínimo para Confirmar (50%)</span>
            <span className="text-2xl font-black text-blue-800 tabular-nums">$ {minPayment.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 space-y-2">
           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
             Al completar el pago, tu reserva cambiará automáticamente a estado <span className="text-emerald-600 font-black">confirmado</span>.
           </p>
        </div>
      </div>

      <div className="space-y-4">
        {preferenceId ? (
          <div className="space-y-4">
            <div className="border-2 border-slate-950 p-1 bg-white hover:bg-slate-50 transition-colors">
              <Wallet 
                initialization={{ preferenceId }} 
                customization={{ valueProp: 'convenience' }}
              />
            </div>
            
            {initPoint && (
              <a 
                href={initPoint}
                className="flex items-center justify-center gap-3 w-full py-4 bg-[#009EE3] text-white font-black uppercase tracking-widest text-[11px] shadow-[6px_6px_0px_black] hover:bg-[#0089c7] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Pagar con Mercado Pago (Redirección)
              </a>
            )}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase text-center">
            Generando botón de pago...
          </div>
        )}
        
        <Link href="/profile" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-colors pt-4">
          Cancelar y volver
        </Link>
      </div>
    </div>
  );
}
