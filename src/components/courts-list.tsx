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
import { Input } from "@/components/ui/input";
import { updateCourtAction } from "@/lib/actions/court";
import { toast } from "sonner";

interface Court {
  id: string;
  name: string;
  type: string;
  surface: string;
  bookings?: any[];
}

export function CourtsList({ 
  courts, 
  totalCapacity = 0,
  openTime = "08:00",
  closeTime = "23:00"
}: { 
  courts: Court[];
  totalCapacity?: number;
  openTime?: string;
  closeTime?: string;
}) {
  const registeredCount = courts.length;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Create slots of 30 mins each within operation hours
  const allPossibleSlots = Array.from({ length: 48 }).map((_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  });

  const timeSlots = allPossibleSlots.filter(time => {
    if (openTime <= closeTime) {
      return time >= openTime && time <= closeTime;
    } else {
      // Overnight range, e.g., 08:00 to 01:00
      return time >= openTime || time <= closeTime;
    }
  });

  const isSlotBooked = (court: Court, timeStr: string) => {
    if (!court.bookings) return false;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);
    
    return court.bookings.some(booking => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return slotTime >= start && slotTime < end;
    });
  };

  // Calculate statistics
  const totalSlotsCount = courts.length * timeSlots.length;
  let occupiedSlotsCount = 0;
  
  courts.forEach(court => {
    timeSlots.forEach(time => {
      if (isSlotBooked(court, time)) {
        occupiedSlotsCount++;
      }
    });
  });
  
  const occupancyRate = totalSlotsCount > 0 
    ? Math.round((occupiedSlotsCount / totalSlotsCount) * 100) 
    : 0;

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
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
                    <CardTitle 
                      className="text-2xl font-black text-primary uppercase tracking-tighter cursor-pointer hover:text-primary/70 flex items-center gap-2 group/title"
                      onClick={() => handleStartEdit(court)}
                    >
                      {court.name}
                      <LucidePencil className="h-4 w-4 opacity-0 group-hover/title:opacity-100 transition-opacity text-muted-foreground" />
                    </CardTitle>
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
                  
                  {/* Dense Time Grid: 8 columns x 6 rows (00:00 - 23:30) */}
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 pt-2">
                    {timeSlots.map((time) => {
                      const booked = isSlotBooked(court, time);
                      return (
                        <div 
                          key={time}
                          className={cn(
                            "group relative flex flex-col items-center justify-center p-1 rounded-sm text-[9px] font-bold transition-all border shadow-sm",
                            booked 
                              ? "bg-slate-400 border-slate-500 text-slate-50" 
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:scale-105 cursor-pointer"
                          )}
                        >
                          {time}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                            <div className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap shadow-xl">
                              {time} - {booked ? 'Reservado' : 'Disponible'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
