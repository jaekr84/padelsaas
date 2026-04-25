import React from "react";
import { getCenterDetailsAction } from "@/lib/actions/public-booking";
import { CenterBookingView } from "@/components/public-booking/center-booking-view";
import Link from "next/link";
import { 
  LucideArrowLeft, 
  LucideMapPin, 
  LucidePhone, 
  LucideGlobe,
  LucideActivity
} from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface CenterPageProps {
  params: Promise<{ id: string }>;
}

export default async function CenterPage({ params }: CenterPageProps) {
  const { id } = await params;
  const result = await getCenterDetailsAction(id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const center = result.data;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-800 selection:text-white">
      {/* 1. Technical Navbar */}
      <nav className="h-16 bg-white border-b-2 border-slate-950 px-6 flex items-center justify-between sticky top-0 z-50">
        <Link href="/explore" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-blue-800 transition-colors">
          <LucideArrowLeft className="h-4 w-4" /> Volver al Directorio
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-slate-950 flex items-center justify-center text-white">
            <LucideActivity className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Padel Centralized Booking</span>
        </div>
      </nav>

      {/* 2. Hero Header */}
      <header className="bg-white border-b-2 border-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-800" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-800">Unidad Operativa Detectada</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-950 leading-none">
                {center.name}
              </h1>
              <div className="flex flex-wrap gap-6 pt-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.address || ""} ${center.city || ""} ${center.state || ""}`.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-800 transition-colors group"
                >
                  <LucideMapPin className="h-3 w-3 text-blue-800 group-hover:scale-110 transition-transform" /> 
                  {center.address ? `${center.address}, ` : ""}{center.city}, {center.state}
                </a>
                {center.phone && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <LucidePhone className="h-3 w-3 text-blue-800" /> {center.phone}
                  </div>
                )}
                {center.website && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <LucideGlobe className="h-3 w-3 text-blue-800" /> {center.website}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-4">
               <div className="bg-slate-50 border border-slate-200 p-4 text-center min-w-[120px]">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 block mb-1">Capacidad</span>
                  <span className="text-xl font-black uppercase tabular-nums text-slate-950">{center.courtsCount} Canchas</span>
               </div>
               <div className="bg-slate-50 border border-slate-200 p-4 text-center min-w-[120px]">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 block mb-1">Status</span>
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase text-emerald-600">Online</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Interactive Module */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <CenterBookingView center={center} />
      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t-2 border-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">
             Sistema de Gestión Deportiva de Grado Industrial • PadelSaaS 2026
           </p>
        </div>
      </footer>
    </div>
  );
}
