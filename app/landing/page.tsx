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
  LucideBox,
  LucideActivity,
  LucideLock,
  LucidePlay
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950 selection:bg-blue-800 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b-2 border-slate-950 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-950 text-white shadow-[4px_4px_0px_rgba(0,51,153,1)]">
            <LucideBox className="h-6 w-6" />
          </div>
          <span className="text-sm font-black uppercase tracking-tighter leading-none">Padel Industrial</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-[10px] font-bold uppercase tracking-widest hover:text-blue-800">Sistemas</Link>
          <button 
            onClick={handleDemoLogin}
            disabled={isLoggingIn}
            className="text-[10px] font-black uppercase tracking-widest text-blue-800 hover:bg-blue-50 px-3 py-2 border border-blue-200 transition-all"
          >
            {isLoggingIn ? "Cargando..." : "Explorar Demo"}
          </button>
          <Link href="/login" className="px-4 py-2 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-800 transition-colors">
            Acceso Terminal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 border-b-2 border-slate-950 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-none">
                <LucideActivity className="h-3 w-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">v2.0 Terminal Operativa</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] text-slate-950">
                Automatización <br />
                <span className="text-blue-800 underline decoration-4 underline-offset-8">Total</span> de Canchas.
              </h1>
              <p className="max-w-md text-lg font-medium text-slate-600 leading-relaxed">
                Software de grado industrial para centros deportivos. Gestión de turnos, POS integrado y control de acceso en una sola terminal de misión crítica.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleDemoLogin}
                  disabled={isLoggingIn}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-800 text-white font-black uppercase tracking-widest shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                >
                  {isLoggingIn ? "Iniciando..." : "Acceder a Demo"} <LucidePlay className="h-4 w-4" />
                </button>
                <Link href="/login" className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-950 text-white font-black uppercase tracking-widest hover:bg-blue-900 transition-all">
                  Login Manual
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="aspect-square bg-slate-100 border-2 border-slate-950 relative group overflow-hidden">
                <img 
                  src="/img/main.jpg" 
                  alt="Padel Center Automation" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-blue-800/10 mix-blend-multiply group-hover:bg-transparent transition-all"></div>
                <div className="absolute top-4 left-4 p-4 bg-white border border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] z-10">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                     <span className="text-[8px] font-bold uppercase tracking-widest">Sistema Online</span>
                   </div>
                   <div className="text-2xl font-black tabular-nums">12:45:00</div>
                </div>
                <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-800 flex items-center justify-center border-4 border-white shadow-2xl z-10">
                   <LucideCalendar className="h-20 w-20 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Industrial Tape */}
      <div className="bg-slate-950 py-4 overflow-hidden border-b-2 border-slate-950">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="flex items-center gap-10 mx-10 text-white text-[10px] font-black uppercase tracking-[0.4em]">
              <span>Misión Crítica</span>
              <span className="text-blue-500">•</span>
              <span>99.9% Uptime</span>
              <span className="text-blue-500">•</span>
              <span>Zero Latency</span>
              <span className="text-blue-500">•</span>
              <span>Encriptación AES-256</span>
              <span className="text-blue-500">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20 text-center space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-800">Infraestructura</h2>
            <p className="text-4xl font-black uppercase tracking-tighter text-slate-950">Módulos de Control Operativo</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-slate-950">
            {[
              { 
                title: "Gestor de Canchas", 
                desc: "Grid dinámico con soporte para drag & drop y múltiples sedes en tiempo real.",
                icon: LucideLayoutDashboard
              },
              { 
                title: "POS Inteligente", 
                desc: "Venta de productos, control de inventario y facturación automatizada.",
                icon: LucideZap
              },
              { 
                title: "Booking Engine", 
                desc: "Motor de reservas externo para clientes con pasarela de pagos integrada.",
                icon: LucideCalendar
              },
              { 
                title: "Analítica Pro", 
                desc: "Reportes técnicos de ocupación, ingresos y comportamiento de clientes.",
                icon: LucideActivity
              },
              { 
                title: "Control de Acceso", 
                desc: "Gestión de puertas y luces automatizada mediante protocolos IoT.",
                icon: LucideLock
              },
              { 
                title: "Base de Datos", 
                desc: "Arquitectura escalable en la nube con redundancia geográfica.",
                icon: LucideBox
              }
            ].map((f, i) => (
              <div key={i} className="p-10 border border-slate-950 bg-white hover:bg-slate-50 transition-colors group">
                <div className="w-12 h-12 bg-slate-100 flex items-center justify-center mb-6 group-hover:bg-blue-800 group-hover:text-white transition-colors border border-slate-950">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-4">{f.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-blue-800 border-t-2 border-slate-950 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <LucideBox className="h-64 w-64" />
        </div>
        <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            ¿Listo para industrializar <br /> tu centro?
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/login" className="px-10 py-5 bg-slate-950 text-white font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_white] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
              Agendar Demo Técnica
            </Link>
            <div className="flex items-center justify-center gap-2">
              <LucideCheckCircle2 className="h-5 w-5 text-blue-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Sin tarjeta de crédito requerida</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t-2 border-slate-950 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-950 text-white">
              <LucideBox className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Padel Industrial © 2026</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-950">Legal</Link>
            <Link href="#" className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-950">Privacidad</Link>
            <Link href="#" className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-950">Soporte Técnico</Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
