import { getPublicCentersAction, getExploreMetaDataAction } from "@/lib/actions/public-booking";
import Link from "next/link";
import {
  LucideMapPin,
  LucideBox,
  LucideArrowRight,
  LucideSearch,
  LucideChevronRight,
  LucideCpu,
  LucideLayoutGrid
} from "lucide-react";

import { PublicNavbar } from "@/components/layout/public-navbar";
import { ExploreFilters } from "@/components/public/explore-filters";

export const dynamic = "force-dynamic";

interface ExplorePageProps {
  searchParams: Promise<{
    sport?: string;
    q?: string;
    city?: string;
    state?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const [centersRes, metaRes] = await Promise.all([
    getPublicCentersAction({
      sport: params.sport,
      query: params.q,
      city: params.city,
      state: params.state
    }),
    getExploreMetaDataAction()
  ]);

  const centers = centersRes.success ? centersRes.data : [];
  const meta = metaRes.success ? metaRes.data : { cities: [], sports: [], states: [] };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950 selection:bg-blue-800 selection:text-white overflow-x-hidden">
      <PublicNavbar />

      {/* Control Toolbar - Ultra Slim Navbar Style */}
      <header className="bg-slate-950 text-white pt-2 pb-2 border-b border-blue-900/50 sticky top-0 z-40 shadow-xl backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

            {/* Minimal Brand & Counter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-blue-800 flex items-center justify-center">
                  <LucideLayoutGrid className="h-2.5 w-2.5 text-white" />
                </div>
                <h1 className="text-[11px] font-black uppercase tracking-tighter">
                  Buscador de <span className="text-blue-500">Canchas</span>
                </h1>
              </div>
              <div className="h-4 w-px bg-slate-800 hidden md:block"></div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Nodos:</span>
                <span className="text-[10px] font-black text-blue-500 tabular-nums">{(centers || []).length}</span>
              </div>
            </div>

            {/* Compact Filters Integrated Row */}
            <div className="flex-grow max-w-5xl">
              <ExploreFilters
                availableSports={meta?.sports || []}
                metaData={meta}
              />
            </div>

            {/* Status Indicator */}
            <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-800">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live_Sync</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content Section */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(centers || []).map((center) => (
            <div
              key={center.id}
              className="group relative flex flex-col bg-white border border-slate-200 transition-all hover:border-blue-500 hover:shadow-[0_10px_30px_rgba(0,51,153,0.05)]"
            >
              <Link href={`/centers/${center.id}`} className="absolute inset-0 z-0" aria-label={`Ver detalles de ${center.name}`} />

              {/* Compact Card Image */}
              <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden border-b border-slate-100">
                {center.logoUrl ? (
                  <img
                    src={center.logoUrl}
                    alt={center.name}
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-100">
                    <LucideBox className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-slate-950/80 backdrop-blur-sm text-white text-[7px] font-black uppercase tracking-widest border border-slate-700">
                  {center.courtsCount} Canchas
                </div>
              </div>

              {/* Compact Card Body */}
              <div className="p-4 space-y-3">
                <div className="space-y-0.5">
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-blue-600 block">
                    {center.tenant?.name || "CLUB"}
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 truncate">
                    {center.name}
                  </h3>
                  <div className="flex items-center gap-1 text-slate-400">
                    <LucideMapPin className="h-2 w-2" />
                    <span className="text-[7px] font-bold uppercase tracking-widest">
                      {center.city}, {center.state}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50 relative z-10 pointer-events-none">
                  <div className="flex flex-col">
                    <span className="text-[6px] font-black uppercase text-slate-400 tracking-widest leading-none">Horario</span>
                    <span className="text-[8px] font-black text-slate-700">{center.openTime} - {center.closeTime}</span>
                  </div>
                  <LucideArrowRight className="h-2.5 w-2.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(centers || []).length === 0 && (
          <div className="py-20 text-center space-y-4 border border-dashed border-slate-200">
            <LucideSearch className="h-8 w-8 mx-auto text-slate-100" />
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Cero Resultados</h3>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400">Reajuste parámetros</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-50 border-t border-slate-100 py-4">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex justify-between items-center opacity-40">
          <div className="flex items-center gap-2">
            <LucideCpu className="h-3 w-3 text-slate-950" />
            <span className="text-[8px] font-black uppercase tracking-widest">Terminal v4.0</span>
          </div>
          <span className="text-[7px] font-bold uppercase tracking-[0.3em]">© 2026 Tu cancha Ya</span>
        </div>
      </footer>
    </div>
  );
}
