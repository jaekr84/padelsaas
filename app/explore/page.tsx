import React from "react";
import { getPublicCentersAction } from "@/lib/actions/public-booking";
import Link from "next/link";
import { 
  LucideMapPin, 
  LucideBox, 
  LucideArrowRight, 
  LucideSearch,
  LucideActivity,
  LucideTrophy,
  LucideClock,
  LucideChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const result = await getPublicCentersAction();
  const centers = result.success ? result.data : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950 selection:bg-blue-800 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b-2 border-slate-950 px-6 md:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/landing" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-slate-950 text-white shadow-[4px_4px_0px_rgba(0,51,153,1)]">
              <LucideBox className="h-7 w-7" />
            </div>
            <span className="text-lg font-black uppercase tracking-tighter leading-none">Tu cancha Ya</span>
          </Link>
        </div>
        <div className="hidden lg:flex items-center gap-10">
          <Link href="/explore" className="text-[11px] font-bold uppercase tracking-widest text-blue-800 underline decoration-2 underline-offset-4">Explorar Sedes</Link>
          <Link href="/register" className="text-[11px] font-black uppercase tracking-widest text-slate-950 border-b-2 border-slate-950 hover:bg-slate-50 px-2 py-1 transition-all">
            Registrar Club
          </Link>
          <Link href="/login" className="px-6 py-3 bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-[4px_4px_0px_#003399]">
            Terminal Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section / Header */}
      <section className="bg-slate-950 text-white pt-24 pb-20 border-b-8 border-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="grid grid-cols-12 h-full">
             {Array.from({ length: 12 }).map((_, i) => (
               <div key={i} className="border-r border-slate-700 h-full"></div>
             ))}
          </div>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-800 text-white">
              <LucideActivity className="h-3 w-3" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Módulo de Búsqueda</span>
            </div>
            <LucideChevronRight className="h-4 w-4 text-slate-700" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Public Access</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            <div>
              <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                Unidades <br />
                <span className="text-blue-800">Operativas</span>.
              </h1>
              <p className="max-w-xl text-slate-400 text-xl font-medium leading-relaxed">
                Terminal de exploración de infraestructura deportiva. Localiza centros, verifica disponibilidad técnica y gestiona tu reserva inmediata.
              </p>
            </div>
            <div className="flex lg:justify-end pb-4">
              <div className="w-full lg:w-96 bg-white border-2 border-slate-950 p-1 flex items-center shadow-[6px_6px_0px_#003399]">
                <div className="px-4 text-slate-400">
                  <LucideSearch className="h-5 w-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="BUSCAR POR NOMBRE O CIUDAD..." 
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-950 placeholder:text-slate-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <main className="max-w-[1400px] mx-auto px-6 md:px-12 py-20">
        <div className="flex items-center justify-between mb-12 pb-6 border-b-2 border-slate-200">
           <div className="flex items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Resultados Detectados:</span>
              <span className="px-3 py-1 bg-slate-950 text-white text-xs font-black tabular-nums">{(centers || []).length}</span>
           </div>
           <div className="flex gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actualizado en tiempo real</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {(centers || []).map((center) => (
            <Link 
              key={center.id} 
              href={`/centers/${center.id}`}
              className="group relative flex flex-col bg-white border-4 border-slate-950 transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_#003399]"
            >
              {/* Card Image Header */}
              <div className="aspect-video bg-slate-100 relative overflow-hidden border-b-4 border-slate-950">
                {center.logoUrl ? (
                  <img 
                    src={center.logoUrl} 
                    alt={center.name} 
                    className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                    <LucideBox className="h-16 w-16 text-slate-200" />
                  </div>
                )}
                
                {/* Overlays */}
                <div className="absolute inset-0 bg-blue-900/5 mix-blend-multiply group-hover:bg-transparent transition-all"></div>
                <div className="absolute top-4 left-4 px-3 py-1 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest border border-slate-700 shadow-xl">
                  {center.courtsCount} Canchas
                </div>
                <div className="absolute bottom-0 right-0 p-4 bg-white border-t-2 border-l-2 border-slate-950 group-hover:bg-blue-800 group-hover:text-white transition-colors">
                   <LucideArrowRight className="h-6 w-6" />
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-800">Operador Certificado</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-950 leading-none">
                    {center.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400">
                    <LucideMapPin className="h-4 w-4 text-slate-300" />
                    <span className="text-xs font-bold uppercase tracking-widest">{center.city}, {center.state}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200">
                  <div className="bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <LucideClock className="h-3 w-3 text-slate-300" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Rango Horario</span>
                    </div>
                    <p className="text-xs font-black text-slate-950 tabular-nums">
                      {center.openTime} - {center.closeTime}
                    </p>
                  </div>
                  <div className="bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <LucideTrophy className="h-3 w-3 text-yellow-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Estado</span>
                    </div>
                    <p className="text-xs font-black text-slate-950 uppercase italic tracking-tighter">PREMIUM</p>
                  </div>
                </div>

                <div className="pt-4">
                   <button className="w-full py-4 bg-slate-950 text-white font-black uppercase tracking-[0.2em] text-[10px] group-hover:bg-blue-800 transition-colors">
                      Acceder a Grilla
                   </button>
                </div>
              </div>

              {/* Blueprint Accents */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-800 border border-slate-950"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-800 border border-slate-950"></div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {(centers || []).length === 0 && (
          <div className="py-40 text-center space-y-8 bg-white border-4 border-dashed border-slate-200">
             <LucideSearch className="h-20 w-20 mx-auto text-slate-100" />
             <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-300">Sin Unidades Detectadas</h3>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Escaneando infraestructura deportiva...</p>
             </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-950 text-white py-20 border-t-8 border-blue-800">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-800 flex items-center justify-center shadow-[4px_4px_0px_white]">
                   <LucideBox className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-black uppercase tracking-[0.4em]">Tu cancha Ya</span>
             </div>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest max-w-xs text-center md:text-left">
                Infraestructura de software para la gestión automatizada de centros deportivos de alto rendimiento.
             </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-6">
             <div className="flex gap-8">
                <Link href="/landing" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Inicio</Link>
                <Link href="/explore" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Explorar</Link>
                <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Admin</Link>
             </div>
             <span className="text-slate-700 text-[10px] font-black uppercase tracking-[0.3em] italic">© 2026 Tu cancha Ya - Terminal 4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
