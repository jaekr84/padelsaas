import React from "react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { LandingContent } from "@/components/landing/landing-content";
import { LucideBox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950 selection:bg-blue-800 selection:text-white overflow-x-hidden">
      <PublicNavbar />
      
      <main>
        <LandingContent />
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t-2 border-slate-950 bg-white text-center">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          <div className="flex h-10 w-10 items-center justify-center bg-slate-950 text-white shadow-[4px_4px_0px_rgba(0,51,153,1)]">
            <LucideBox className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Tu cancha Ya © 2026</span>
        </div>
      </footer>
    </div>
  );
}
