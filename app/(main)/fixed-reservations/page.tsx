"use client";

import { useEffect, useState } from "react";
import { getCenterAction } from "@/lib/actions/center";
import { getCourtsAction } from "@/lib/actions/court";
import { FixedReservationManager } from "@/components/fixed-reservation-manager";
import { LucideLoader2 } from "lucide-react";

export default function FixedReservationsPage() {
  const [center, setCenter] = useState<any>(null);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [centerData, courtsData] = await Promise.all([
          getCenterAction(),
          getCourtsAction()
        ]);
        setCenter(centerData);
        setCourts(courtsData);
      } catch (error) {
        console.error("Error loading fixed reservations data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <LucideLoader2 className="h-10 w-10 animate-spin text-blue-800" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Sincronizando entorno de abonos...</p>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 px-8 py-4 bg-slate-50">
          Error Crítico: No se detectó configuración de centro operativa.
        </p>
      </div>
    );
  }

  return (
    <FixedReservationManager 
      centerId={center.id}
      center={center}
      courts={courts}
      openTime={center.openTime}
      closeTime={center.closeTime}
    />
  );
}
