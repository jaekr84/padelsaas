"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LucideLayoutGrid,
  LucideSun,
  LucideMonitor,
  LucideDumbbell,
  LucideCheckCircle2,
  LucideAlertCircle,
  LucidePencil,
  LucideSave,
  LucideX,
  LucidePieChart,
  LucideActivity,
  LucideCalendar,
  LucideChevronLeft,
  LucideChevronRight,
  LucideLoader2,
  LucideShieldCheck,
  LucideClock,
  LucideBarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { updateCourtAction } from "@/lib/actions/court";
import { toast } from "sonner";
import { ManualReservationSheet } from "./manual-reservation-sheet";
import { CourtTimeGrid, TimeGridCourt } from "./court-time-grid";
import { parseArgentineDate } from "@/lib/date-utils";

export type Court = TimeGridCourt;

export const generateTimeSlots = (openTime: string = "08:00", closeTime: string = "23:00") => {
  const toMins = (t: string) => {
    const [h, m] = (t || "08:00").trim().split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const startMins = toMins(openTime);
  const endMins = toMins(closeTime);

  const slots: string[] = [];

  if (startMins <= endMins) {
    for (let m = startMins; m <= endMins; m += 30) {
      const h = Math.floor(m / 60);
      const mins = m % 60 === 0 ? "00" : "30";
      slots.push(`${h.toString().padStart(2, '0')}:${mins}`);
    }
  } else {
    for (let m = startMins; m < 1440; m += 30) {
      const h = Math.floor(m / 60);
      const mins = m % 60 === 0 ? "00" : "30";
      slots.push(`${h.toString().padStart(2, '0')}:${mins}`);
    }
    for (let m = 0; m <= endMins; m += 30) {
      const h = Math.floor(m / 60);
      const mins = m % 60 === 0 ? "00" : "30";
      slots.push(`${h.toString().padStart(2, '0')}:${mins}`);
    }
  }

  return slots;
};

export const isSlotBooked = (court: Court, timeStr: string, baseDateStr?: string, openTime?: string) => {
  if (!court.bookings) return false;

  const slotTime = baseDateStr
    ? parseArgentineDate(baseDateStr, timeStr, openTime)
    : new Date();

  if (!baseDateStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    slotTime.setHours(hours, minutes, 0, 0);
  }

  return court.bookings.some(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return slotTime >= start && slotTime < end;
  });
};

export function CourtsList({
  courts,
  center,
  globalDate,
}: {
  courts: Court[];
  center: any;
  globalDate?: string;
}) {
  const openTime = center?.openTime || "08:00";
  const closeTime = center?.closeTime || "23:00";
  const totalCapacity = center?.courtsCount || 0;

  const router = useRouter();

  const rawDateStr = globalDate || new Date().toISOString().split("T")[0];
  const [_y, _m, _d] = rawDateStr.split('-').map(Number);
  const activeDateObj = new Date(_y, _m - 1, _d);

  const registeredCount = courts.length;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [saving, setSaving] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialSlot, setInitialSlot] = useState<{ courtId: string; time: string } | null>(null);

  const timeSlots = generateTimeSlots(openTime, closeTime);

  const totalSlotsCount = courts.length * timeSlots.length;
  let occupiedSlotsCount = 0;

  courts.forEach(court => {
    timeSlots.forEach(time => {
      if (isSlotBooked(court, time, rawDateStr, openTime)) {
        occupiedSlotsCount++;
      }
    });
  });

  const occupancyRate = totalSlotsCount > 0
    ? Math.round((occupiedSlotsCount / totalSlotsCount) * 100)
    : 0;

  const getCourtOccupancy = (court: Court) => {
    let occupied = 0;
    timeSlots.forEach(time => {
      if (isSlotBooked(court, time, rawDateStr, openTime)) {
        occupied++;
      }
    });
    return timeSlots.length > 0 ? Math.round((occupied / timeSlots.length) * 100) : 0;
  };

  const handleStartEdit = (court: Court) => {
    setEditingId(court.id);
    setTempName(court.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempName("");
  };

  const handleSaveName = async (id: string) => {
    if (!tempName.trim()) return;
    setSaving(true);
    try {
      await updateCourtAction(id, { name: tempName.trim() });
      setEditingId(null);
      toast.success("Nombre actualizado");
    } catch (error) {
      toast.error("Error al actualizar el nombre");
    } finally {
      setSaving(false);
    }
  };

  const handleCellClick = (court: Court, time: string, booked: boolean) => {
    if (booked) return;
    setInitialSlot({ courtId: court.id, time });
    setSheetOpen(true);
  };

  const handlePrevDay = () => {
    const prev = new Date(activeDateObj);
    prev.setDate(prev.getDate() - 1);
    router.push(`/courts?date=${prev.toISOString().split("T")[0]}`);
  };

  const handleNextDay = () => {
    const next = new Date(activeDateObj);
    next.setDate(next.getDate() + 1);
    router.push(`/courts?date=${next.toISOString().split("T")[0]}`);
  };

  const handleToday = () => {
    router.push('/courts');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      router.push(`/courts?date=${e.target.value}`);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500" key={`${center?.id}-${rawDateStr}`}>

      {/* 1. Technical Header & Date Navigator */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-6 bg-blue-800" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-800">Panel Operativo</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">Estado de Canchas</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Monitoreo de ocupación y gestión de grillas horarias</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-none h-11">
            <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-full w-12 rounded-none border-r border-slate-100 hover:bg-slate-50">
              <LucideChevronLeft className="h-4 w-4 text-slate-400" />
            </Button>
            <div className="px-4">
              <Input
                type="date"
                value={rawDateStr}
                onChange={handleDateChange}
                className="border-0 shadow-none h-8 bg-transparent text-[11px] font-black uppercase tracking-widest cursor-pointer focus-visible:ring-0 w-36 px-0 text-center"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-full w-12 rounded-none border-l border-slate-100 hover:bg-slate-50">
              <LucideChevronRight className="h-4 w-4 text-slate-400" />
            </Button>
            <div className="h-full w-px bg-slate-200" />
            <Button
              variant="ghost"
              onClick={handleToday}
              className="h-full px-6 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 rounded-none"
            >
              Hoy
            </Button>
          </div>

          <Button
            onClick={() => {
              setInitialSlot(null);
              setSheetOpen(true);
            }}
            className="h-11 rounded-none bg-blue-800 hover:bg-blue-900 text-white font-black uppercase tracking-[0.2em] text-[10px] px-8 transition-all gap-3 shadow-none"
          >
            <LucideCalendar className="h-4 w-4" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) - Industrial Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white border border-slate-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidad Instalada</span>
            <LucideLayoutGrid className="h-4 w-4 text-blue-800" />
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter text-slate-950">
              {courts.length}<span className="text-slate-200 mx-2 text-3xl font-light">/</span>{totalCapacity}
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
              {registeredCount === totalCapacity ? "OPERATIVIDAD AL 100%" : `${totalCapacity - registeredCount} RECURSOS PENDIENTES`}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rendimiento Diario</span>
            <LucideBarChart3 className="h-4 w-4 text-blue-800" />
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter text-blue-800">
              {occupancyRate}%
            </div>
            <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-none overflow-hidden">
              <div
                className="h-full bg-blue-800 transition-all duration-1000"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
              UTILIZACIÓN SEGÚN VENTANA OPERATIVA
            </p>
          </div>
        </div>
      </div>

      {/* 3. Courts Matrix - High Density Layout */}
      {courts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50">
          <div className="h-16 w-16 bg-slate-100 flex items-center justify-center mb-6">
            <LucideAlertCircle className="h-8 w-8 text-slate-300" />
          </div>
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Sin Recursos Configurables</h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2 max-w-xs">
            No se detectaron canchas registradas en este centro operativo.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
          {courts.map((court) => (
            <div key={court.id} className="bg-white border border-slate-200 overflow-hidden transition-all hover:border-slate-400">
              {/* Card Header Industrial */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                {editingId === court.id ? (
                  <div className="flex items-center gap-3">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="h-11 bg-white border-slate-300 text-lg font-black uppercase tracking-tighter rounded-none focus-visible:ring-0 focus-visible:border-blue-800"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName(court.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      disabled={saving}
                    />
                    <Button
                      size="icon"
                      onClick={() => handleSaveName(court.id)}
                      disabled={saving}
                      className="h-11 w-11 rounded-none bg-blue-800 hover:bg-blue-900 text-white shadow-none"
                    >
                      <LucideSave className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="h-11 w-11 rounded-none border-slate-200 text-slate-400 hover:text-slate-950 shadow-none"
                    >
                      <LucideX className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 group/title">
                        <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">
                          {court.name}
                        </h2>
                        <button
                          onClick={() => handleStartEdit(court)}
                          className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 hover:text-blue-800 text-slate-400"
                        >
                          <LucidePencil className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-1 w-32 bg-slate-200 rounded-none overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-1000",
                              getCourtOccupancy(court) > 80 ? 'bg-blue-950' :
                                getCourtOccupancy(court) > 50 ? 'bg-blue-800' :
                                  'bg-blue-600'
                            )}
                            style={{ width: `${getCourtOccupancy(court)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                          {getCourtOccupancy(court)}% UTILIZACIÓN DIARIA
                        </span>
                      </div>
                    </div>

                    <div className="h-10 w-10 bg-slate-950 flex items-center justify-center text-white">
                      <LucideShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Content - Matrix */}
              <div className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                      Disponibilidad Operativa
                    </span>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-blue-800" />
                        <span className="text-slate-950">Libre</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-slate-200" />
                        <span className="text-slate-400">Ocupado</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 p-2">
                    <CourtTimeGrid
                      court={court}
                      timeSlots={timeSlots}
                      isSlotBooked={(c, t) => isSlotBooked(c, t, rawDateStr, openTime)}
                      onSlotClick={handleCellClick}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Reservation Sheet - The sheet itself should already be industrial but we pass the data */}
      {courts.length > 0 && (
        <ManualReservationSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          centerId={center?.id}
          center={center}
          courts={courts}
          initialSlot={initialSlot}
          openTime={openTime}
          closeTime={closeTime}
          globalDateStr={rawDateStr}
        />
      )}
    </div>
  );
}
