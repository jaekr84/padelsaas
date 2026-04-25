"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { 
  LucideLayoutDashboard, 
  LucideCalendar, 
  LucideZap, 
  LucideArrowRight, 
  LucideCheckCircle2,
  LucideActivity,
  LucideLock,
  LucidePlay
} from "lucide-react";
import { PhoneSimulator } from "@/components/demo/phone-simulator";

export function LandingContent() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signIn("credentials", {
        email: "demo@demo.com",
        password: "demo",
        callbackUrl: "/home",
      });
    } catch (error) {
      console.error("Demo login failed", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-24 px-6 md:px-12 border-b-2 border-slate-950 bg-white overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-800">
                <LucideActivity className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">v2.4 Estación Operativa</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-slate-950">
                Control <br />
                <span className="text-blue-800 underline decoration-8 underline-offset-8">Mecanizado</span> <br />
                de Canchas.
              </h1>
              <p className="max-w-xl text-xl font-medium text-slate-600 leading-relaxed">
                Gestión automatizada para centros deportivos. Reserva pública, terminal de punto de venta y analítica técnica en una sola infraestructura.
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <Link href="/explore" className="flex items-center justify-center gap-4 px-10 py-5 bg-blue-800 text-white font-black uppercase tracking-widest shadow-[8px_8px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                  Reservar Turno <LucideArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/register" className="flex items-center justify-center gap-4 px-10 py-5 bg-white border-4 border-slate-950 text-slate-950 font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Registrarse
                </Link>
              </div>
            </div>
            
            <div className="lg:col-span-5 relative">
              <div className="aspect-square bg-slate-100 border-4 border-slate-950 relative group overflow-hidden shadow-[12px_12px_0px_#003399]">
                <img 
                  src="/img/main.jpg" 
                  alt="Padel Center" 
                  className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay group-hover:bg-transparent transition-all"></div>
                
                {/* Floating Stats UI */}
                <div className="absolute top-8 left-8 p-6 bg-white border-2 border-slate-950 shadow-[6px_6px_0px_black] z-10">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sistema Online</span>
                   </div>
                   <div className="text-4xl font-black tabular-nums">0.2ms</div>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Latencia de Red</span>
                </div>
                
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-800 flex items-center justify-center border-4 border-white shadow-2xl z-10 animate-in fade-in zoom-in duration-1000">
                   <LucideCalendar className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industrial Tape / Marquee */}
      <div className="bg-slate-950 py-5 overflow-hidden border-b-2 border-slate-950">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1,2,3,4].map((i) => (
            <div key={i} className="flex items-center gap-16 mx-12 text-white text-[11px] font-black uppercase tracking-[0.5em]">
              <span>Misión Crítica</span>
              <span className="text-blue-500">•</span>
              <span>Hardware Ready</span>
              <span className="text-blue-500">•</span>
              <span>Automatización IoT</span>
              <span className="text-blue-500">•</span>
              <span>Facturación Real</span>
              <span className="text-blue-500">•</span>
              <span>99.9% Uptime</span>
              <span className="text-blue-500">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone Simulator Section */}
      <section className="py-24 px-6 md:px-12 bg-white border-b-2 border-slate-950 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest">
                Módulo de Comunicación
              </div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                Sincronización <br />
                <span className="text-blue-800">Total</span>.
              </h2>
              <p className="text-xl font-medium text-slate-500 leading-relaxed max-w-lg">
                Tu cliente recibe notificaciones automáticas de sus reservas, cambios de estado y recordatorios tácticos directamente en su terminal móvil. Sin intervención manual.
              </p>
              <div className="space-y-4">
                 {[
                   "Confirmación instantánea vía Push",
                   "Recordatorios 1h antes del turno",
                   "Gestión de lista de espera automática"
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-4">
                      <div className="h-6 w-6 bg-blue-800 text-white flex items-center justify-center">
                         <LucideCheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-950">{item}</span>
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
               <PhoneSimulator />
            </div>
          </div>
        </div>
        
        {/* Background Decorative Grid */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 -z-10 border-l border-slate-100"></div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-slate-950">
            {[
              { 
                title: "Gestor Técnico", 
                desc: "Grilla de alta densidad con control de conflictos y bloqueos manuales.",
                icon: LucideLayoutDashboard
              },
              { 
                title: "POS Mecanizado", 
                desc: "Venta de productos, alquiler de palas y gestión de inventario en tiempo real.",
                icon: LucideZap
              },
              { 
                title: "Seguridad AES", 
                desc: "Protocolos de encriptación de grado militar para transacciones y datos.",
                icon: LucideLock
              }
            ].map((f, i) => (
              <div key={i} className="p-16 border-2 border-slate-950 bg-white hover:bg-slate-50 transition-all group">
                <div className="w-16 h-16 bg-slate-100 border-2 border-slate-950 flex items-center justify-center mb-10 group-hover:bg-blue-800 group-hover:text-white transition-all group-hover:-translate-y-2 group-hover:shadow-[8px_8px_0px_black]">
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-6">{f.title}</h3>
                <p className="text-base text-slate-500 font-bold uppercase tracking-tight leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 md:px-12 bg-blue-800 border-t-2 border-slate-950 text-white text-center relative overflow-hidden">
         <div className="max-w-4xl mx-auto space-y-12 relative z-10">
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
               Industrializa <br /> tu centro.
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-8">
               <Link href="/register" className="px-12 py-6 bg-white text-slate-950 font-black uppercase tracking-[0.2em] shadow-[10px_10px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                  Registrar Ahora
               </Link>
               <button 
                onClick={handleDemoLogin}
                disabled={isLoggingIn}
                className="px-12 py-6 bg-slate-950 text-white font-black uppercase tracking-[0.2em] shadow-[10px_10px_0px_white] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
               >
                  {isLoggingIn ? "Cargando..." : "Acceso Terminal"}
               </button>
            </div>
         </div>
      </section>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </>
  );
}
