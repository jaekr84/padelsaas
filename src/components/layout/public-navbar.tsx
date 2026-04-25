import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { LucideBox, LucideUser, LucideLayoutDashboard } from "lucide-react";

export async function PublicNavbar() {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'owner' || session?.user?.role === 'member';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-slate-950 px-6 md:px-12 h-20 flex items-center justify-between">
      <Link href="/landing" className="flex items-center gap-4 group">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-slate-950 text-white shadow-[4px_4px_0px_rgba(0,51,153,1)] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
          <LucideBox className="h-7 w-7" />
        </div>
        <span className="text-lg font-black uppercase tracking-tighter leading-none">Tu cancha Ya</span>
      </Link>

      <div className="hidden lg:flex items-center gap-10">
        <Link href="/explore" className="text-[11px] font-bold uppercase tracking-widest text-blue-800 hover:underline">Explorar Sedes</Link>
        
        {!session ? (
          <>
            <Link href="/register" className="text-[11px] font-black uppercase tracking-widest text-slate-950 border-b-2 border-slate-950 hover:bg-slate-50 px-2 py-1 transition-all">
              Registro
            </Link>
            <Link href="/login" className="px-6 py-3 bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-[4px_4px_0px_#003399]">
              Ingresar
            </Link>
          </>
        ) : (
          <Link 
            href={isAdmin ? "/home" : "/profile"} 
            className="px-6 py-3 bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-[4px_4px_0px_#003399] flex items-center gap-2"
          >
            {isAdmin ? (
              <LucideLayoutDashboard className="h-4 w-4" />
            ) : (
              <LucideUser className="h-4 w-4" />
            )}
            {isAdmin ? "Mi Panel" : "Mi Perfil"}
          </Link>
        )}
      </div>
    </nav>
  );
}
