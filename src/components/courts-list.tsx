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
  LucideCalendar
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LucideChevronLeft, LucideChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateCourtAction } from "@/lib/actions/court";
import { toast } from "sonner";
import { ManualReservationSheet } from "./manual-reservation-sheet";

import { CourtTimeGrid, TimeGridCourt } from "./court-time-grid";

export type Court = TimeGridCourt;

export const generateTimeSlots = (openTime: string, closeTime: string) => {
  const allPossibleSlots = Array.from({ length: 48 }).map((_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  });

  return allPossibleSlots.filter(time => {
    if (openTime <= closeTime) {
      return time >= openTime && time <= closeTime;
    } else {
      return time >= openTime || time <= closeTime;
    }
  });
};

export const isSlotBooked = (court: Court, timeStr: string, baseDateStr?: string) => {
  if (!court.bookings) return false;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  let slotTime;
  if (baseDateStr) {
    const [y, m, d] = baseDateStr.split('-').map(Number);
    slotTime = new Date(y, m - 1, d, hours, minutes, 0, 0);
  } else {
    slotTime = new Date();
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
  totalCapacity = 0,
  openTime = "08:00",
  closeTime = "23:00",
  globalDate,
}: { 
  courts: Court[];
  totalCapacity?: number;
  openTime?: string;
  closeTime?: string;
  globalDate?: string;
}) {
  const router = useRouter();
  
  const rawDateStr = globalDate || new Date().toISOString().split("T")[0];
  const [_y, _m, _d] = rawDateStr.split('-').map(Number);
  const activeDateObj = new Date(_y, _m - 1, _d);

  const registeredCount = courts.length;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialSlot, setInitialSlot] = useState<{ courtId: string; time: string } | null>(null);
  
  const timeSlots = generateTimeSlots(openTime, closeTime);

  // Calculate statistics
  const totalSlotsCount = courts.length * timeSlots.length;
  let occupiedSlotsCount = 0;
  
  courts.forEach(court => {
    timeSlots.forEach(time => {
      if (isSlotBooked(court, time, rawDateStr)) {
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
      if (isSlotBooked(court, time, rawDateStr)) {
        occupied++;
      }
    });
    return timeSlots.length > 0 ? Math.round((occupied / timeSlots.length) * 100) : 0;
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "text-orange-600";
    if (rate >= 50) return "text-blue-600";
    return "text-emerald-600";
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
    if (booked) return; // Do not open for already booked slots
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <h3 className="text-xl font-bold tracking-tight hidden lg:block">Rendimiento</h3>
        
        {/* Navbar Navegador de Fechas */}
        <div className="flex bg-card items-center border border-border shadow-sm rounded-lg p-1 mx-auto sm:mx-0">
          <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-8 w-8 hover:bg-muted">
            <LucideChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-2 border-x border-border/50 mx-1 flex items-center">
             <Input 
               type="date"
               value={rawDateStr}
               onChange={handleDateChange}
               className="border-0 shadow-none h-8 bg-transparent text-sm font-bold tracking-tight cursor-pointer focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
             />
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8 hover:bg-muted">
            <LucideChevronRight className="h-4 w-4" />
          </Button>
          <div className="border-l border-border/50 h-4 mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleToday} 
            className="h-8 px-2 text-[10px] font-black uppercase hover:bg-muted"
          >
            Hoy
          </Button>
        </div>
        <Button 
          onClick={() => {
            setInitialSlot(null);
            setSheetOpen(true);
          }}
          className="gap-2 font-bold uppercase tracking-wider text-xs ml-auto"
        >
          <LucideCalendar className="h-4 w-4" />
          Nueva Reserva
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-0">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Total Canchas
            </CardTitle>
            <LucideLayoutGrid className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-primary">
              {courts.length} / {totalCapacity}
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
              {registeredCount === totalCapacity ? "Capacidad completa" : `${totalCapacity - registeredCount} pendientes`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Ocupación Hoy
            </CardTitle>
            <LucidePieChart className={cn("h-4 w-4", getOccupancyColor(occupancyRate))} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-black tracking-tighter", getOccupancyColor(occupancyRate))}>
              {occupancyRate}%
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
              Basado en horario operativo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Horario
            </CardTitle>
            <LucideCalendar className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-emerald-700">
              {openTime} - {closeTime}
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
              Configurado en ajustes
            </p>
          </CardContent>
        </Card>
      </div>

      {courts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
          <div className="bg-muted p-4 rounded-full mb-4">
            <LucideLayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>No hay canchas configuradas</CardTitle>
          <p className="text-muted-foreground mt-2 max-w-xs">
            Asegúrate de configurar la cantidad de canchas en los ajustes.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {courts.map((court) => (
            <Card key={court.id} className="overflow-hidden shadow-md hover:shadow-lg transition-all border-muted/60 bg-card">
              <CardHeader className="py-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
                {editingId === court.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="h-9 text-lg font-bold uppercase tracking-tighter"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName(court.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      disabled={saving}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-green-600"
                      onClick={() => handleSaveName(court.id)}
                      disabled={saving}
                    >
                      <LucideSave className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <LucideX className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <CardTitle 
                        className="text-2xl font-black text-primary uppercase tracking-tighter cursor-pointer hover:text-primary/70 flex items-center gap-2 group/title"
                        onClick={() => handleStartEdit(court)}
                      >
                        {court.name}
                        <LucidePencil className="h-4 w-4 opacity-0 group-hover/title:opacity-100 transition-opacity text-muted-foreground" />
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden border border-gray-300/30">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              getCourtOccupancy(court) > 80 ? 'bg-red-500' : 
                              getCourtOccupancy(court) > 50 ? 'bg-amber-500' : 
                              'bg-emerald-500'
                            )}
                            style={{ width: `${getCourtOccupancy(court)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-tighter">
                          {getCourtOccupancy(court)}% Ocupado hoy
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Disponibilidad Hoy (24hs)
                    </span>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                        <span>Libre</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm" />
                        <span>Ocupado</span>
                      </div>
                    </div>
                  </div>
                  
                  <CourtTimeGrid 
                    court={court}
                    timeSlots={timeSlots}
                    isSlotBooked={(c, t) => isSlotBooked(c, t, rawDateStr)}
                    onSlotClick={handleCellClick}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Manual Reservation Sheet */}
      {courts.length > 0 && (
        <ManualReservationSheet 
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          centerId={courts[0]?.centerId}
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
