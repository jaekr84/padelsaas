"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LucideLoader2,
  LucideCalendarDays,
  LucideRepeat,
  LucideClock,
  LucideAlertTriangle,
  LucideDollarSign,
  LucideUsers,
  LucideSearch,
  LucideRotateCcw,
  LucideX,
  LucideShieldCheck
} from "lucide-react";
import { useReservationForm } from "@/hooks/use-reservation-form";
import { generateTimeSlots } from "./courts-list";
import { CourtTimeGrid, TimeGridCourt } from "./court-time-grid";
import { getCourtsAction } from "@/lib/actions/court";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isSlotBooked } from "./manual-reservation-sheet";

interface FixedReservationManagerProps {
  centerId: string;
  center?: any;
  courts: TimeGridCourt[];
  openTime?: string;
  closeTime?: string;
}

export function FixedReservationManager({
  centerId,
  center,
  courts,
  openTime = "08:00",
  closeTime = "23:00"
}: FixedReservationManagerProps) {
  const {
    form,
    onSubmit,
    loading,
    isValidating,
    validationResults,
    onSimulateBatch,
    toggleResultSelection,
    appliedRateInfo,
    clearValidation
  } = useReservationForm({
    onSuccess: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    centerId,
    center,
  });

  const [previewCourts, setPreviewCourts] = useState<TimeGridCourt[] | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null);
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);

  useEffect(() => {
    form.setValue("reservationType", "recurring");
    
    const currentStart = form.getValues("dateStr");
    const currentEnd = form.getValues("recurringEndDateStr");
    
    if (currentStart && (!currentEnd || currentEnd === "")) {
      const startDate = new Date(currentStart + 'T12:00:00');
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      form.setValue("recurringEndDateStr", format(endDate, "yyyy-MM-dd"), { shouldDirty: true });
    }
  }, [form]);

  const watchDateStr = form.watch("dateStr") || "";
  const watchRecurringEndDateStr = form.watch("recurringEndDateStr") || "";
  const watchRecurringDays = form.watch("recurringDays") || [];
  const watchCourtId = form.watch("courtId") || "auto";
  const watchStartTime = form.watch("startTimeStr") || "";
  const watchDuration = form.watch("durationMins") || 90;

  const activeCourts = (previewCourts || courts) as TimeGridCourt[];
  let gridCourt: TimeGridCourt;

  if (watchCourtId === "auto") {
    gridCourt = {
      id: "auto",
      name: "Ocupación Global",
      centerId: centerId,
      surface: "Todas",
      type: "Múltiple",
      bookings: activeCourts.flatMap(c => c.bookings)
    };
  } else {
    gridCourt = activeCourts.find((c) => c.id === watchCourtId) || activeCourts[0];
  }

  const handleInspectRow = async (idx: number) => {
    if (!validationResults) return;
    const result = validationResults[idx];
    setInspectedIndex(idx);

    const date = new Date(result.startTime);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    if (dateStr !== (inspectedDate || watchDateStr)) {
      setIsPreviewLoading(true);
      try {
        const fetchedCourts = await getCourtsAction(dateStr, centerId);
        setPreviewCourts(fetchedCourts as any);
      } catch (error) {
        console.error("Error fetching courts for preview:", error);
      } finally {
        setIsPreviewLoading(false);
      }
    } else {
      setPreviewCourts(null);
    }
    setInspectedDate(dateStr);

    const startObj = new Date(result.startTime);
    const duration = Math.round((new Date(result.endTime).getTime() - startObj.getTime()) / 60000);
    const timeStr = startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    if (result.courtId === 'auto' && courts.length > 0) {
      form.setValue("courtId", courts[0].id, { shouldDirty: true });
    } else {
      form.setValue("courtId", result.courtId, { shouldDirty: true });
    }
    form.setValue("startTimeStr", timeStr, { shouldDirty: true });
    form.setValue("durationMins", duration, { shouldDirty: true });
  };

  const timeSlots = generateTimeSlots(openTime, closeTime);
  const selectedCount = validationResults?.filter((r: any) => r.selected).length || 0;

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-12 pb-40 animate-in fade-in duration-700">
      
      {/* Page Header - Minimalist */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideRepeat className="h-6 w-6 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Módulo de Reservas</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Reservas Fijas</h1>
          <p className="text-slate-400 font-medium tracking-wide mt-2">Configuración de alquileres de largo plazo y bloqueos recurrentes</p>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={() => {
              clearValidation();
              form.reset();
              form.setValue("reservationType", "recurring");
          }}
          className="h-12 rounded-xl text-slate-400 font-bold px-6 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <LucideRotateCcw className="h-4 w-4 mr-2" />
          Reiniciar Formulario
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-12">
          
          {/* Main Controls Grid - Flat Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Identity & Basic Info (4/12) */}
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">1. Información General</h2>
                </div>

                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre del Cliente / Grupo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Torneo de los Miércoles"
                            className="h-14 bg-slate-50/50 border-slate-100 text-slate-900 font-bold rounded-xl px-6 focus:bg-white transition-all shadow-sm shadow-slate-100/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] ml-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courtId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cancha Preferida</FormLabel>
                        <Select onValueChange={(val) => field.onChange(val || "")} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="w-full h-14 bg-slate-50/50 border-slate-100 text-slate-900 font-bold rounded-xl px-6 focus:bg-white transition-all shadow-sm shadow-slate-100/50">
                              <SelectValue placeholder="Seleccionar cancha..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="auto" className="font-bold text-emerald-600">Ocupación Global (Todas)</SelectItem>
                            {courts.map((court) => (
                              <SelectItem key={court.id} value={court.id} className="font-medium">
                                {court.name} - {court.type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Timing & Recurrence (8/12) */}
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* Time Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">2. Horarios y Fechas</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateStr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Desde</FormLabel>
                          <Input type="date" className="h-14 bg-slate-50/50 border-slate-100 text-slate-900 font-bold rounded-xl px-6 focus:bg-white transition-all shadow-sm shadow-slate-100/50" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurringEndDateStr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hasta</FormLabel>
                          <Input type="date" className="h-14 bg-slate-50/50 border-slate-100 text-slate-900 font-bold rounded-xl px-6 focus:bg-white transition-all shadow-sm shadow-slate-100/50" {...field} value={field.value || ""} />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTimeStr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Inicio</FormLabel>
                          <Select onValueChange={(val) => field.onChange(val || "")} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="w-full h-14 bg-slate-50/50 border-slate-100 text-slate-900 font-bold rounded-xl px-6 focus:bg-white transition-all shadow-sm shadow-slate-100/50">
                                <SelectValue placeholder="Hora..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationMins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duración</FormLabel>
                          <Select onValueChange={(val) => field.onChange(parseInt(val || "0"))} value={field.value ? String(field.value) : ""}>
                            <FormControl>
                              <SelectTrigger className="w-full h-14 bg-slate-50/50 border-slate-100 text-slate-900 font-bold rounded-xl px-6 focus:bg-white transition-all shadow-sm shadow-slate-100/50">
                                <SelectValue placeholder="Mins..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[60, 90, 120, 150, 180].map(m => <SelectItem key={m} value={m.toString()}>{m} min</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Days Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">3. Días y Simulación</h2>
                  </div>

                  <FormField
                    control={form.control}
                    name="recurringDays"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2 py-2">
                        {[
                          { id: 1, label: "L" }, { id: 2, label: "M" }, { id: 3, label: "X" },
                          { id: 4, label: "J" }, { id: 5, label: "V" }, { id: 6, label: "S" }, { id: 0, label: "D" }
                        ].map(day => {
                          const active = field.value?.includes(day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => {
                                const current = field.value || [];
                                const next = active ? current.filter((d: number) => d !== day.id) : [...current, day.id];
                                field.onChange(next);
                              }}
                              className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center text-xs font-black transition-all border-2",
                                active 
                                  ? "bg-slate-900 border-slate-900 text-white scale-105 shadow-lg shadow-slate-200" 
                                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                              )}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />

                  <Button 
                    type="button"
                    onClick={onSimulateBatch}
                    disabled={isValidating || !watchDateStr || !watchRecurringEndDateStr || watchRecurringDays.length === 0}
                    className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                  >
                    {isValidating ? <LucideLoader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        <LucideSearch className="h-5 w-5 mr-2" />
                        Validar Disponibilidad
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Canvas - No Card, just layout */}
          {validationResults && (
            <div className="pt-12 border-t border-slate-100 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <LucideShieldCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Revisión de Disponibilidad</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Haz clic en un turno para inspeccionar el estado de la cancha</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2 px-3">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Conflicto</span>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-12">
                {/* Visual Grid (8/12) */}
                <div className="lg:col-span-8">
                  <div className="bg-slate-50/30 border border-slate-100 rounded-[2rem] p-8 relative overflow-hidden min-h-[500px]">
                    {isPreviewLoading && (
                      <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                        <LucideLoader2 className="h-10 w-10 animate-spin text-emerald-600" />
                      </div>
                    )}
                    <div className="w-full">
                      {inspectedIndex !== null && (
                         <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                               <LucideCalendarDays className="h-4 w-4 text-emerald-600" />
                               <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                  {format(new Date(validationResults[inspectedIndex].startTime), "EEEE dd/MM", { locale: es })}
                               </span>
                            </div>
                            <button onClick={() => setPreviewCourts(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                               <LucideX className="h-4 w-4" />
                            </button>
                         </div>
                      )}
                      <CourtTimeGrid 
                        court={gridCourt}
                        isGlobalView={watchCourtId === "auto"}
                        allCourts={activeCourts}
                        timeSlots={timeSlots}
                        isSlotBooked={(c, t) => {
                          const dateStr = (inspectedDate || watchDateStr || "") as string;
                          if (watchCourtId === "auto") {
                            return activeCourts.length > 0 && activeCourts.every(court => isSlotBooked(court, t, dateStr));
                          }
                          if (!c || c.id === "auto") return false;
                          return isSlotBooked(c, t, dateStr);
                        }}
                        selectedTime={watchStartTime}
                        selectedDurationMins={watchDuration}
                      />
                    </div>
                  </div>
                </div>

                {/* Turn Table (Excel Style) (5/12) */}
                <div className="lg:col-span-4 max-h-[600px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl bg-white shadow-sm">
                  <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 bg-slate-50 z-20 border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200">Día</th>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200">Fecha</th>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200 text-center">Horario</th>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-200 text-center">Estado</th>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Sel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validationResults.map((result, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => handleInspectRow(idx)}
                          className={cn(
                            "group cursor-pointer transition-colors",
                            inspectedIndex === idx 
                              ? "bg-slate-900 text-white" 
                              : "hover:bg-slate-50 text-slate-600"
                          )}
                        >
                          <td className="p-3 text-[10px] font-bold uppercase border-r border-slate-100/50">
                            {format(new Date(result.startTime), "EEEE", { locale: es }).substring(0, 3)}
                          </td>
                          <td className="p-3 text-[11px] font-medium border-r border-slate-100/50">
                            {format(new Date(result.startTime), "dd/MM")}
                          </td>
                          <td className="p-3 text-[11px] font-mono border-r border-slate-100/50 text-center">
                            {format(new Date(result.startTime), "HH:mm")}
                          </td>
                          <td className="p-3 border-r border-slate-100/50 text-center">
                            {result.status === 'ok' ? (
                              <div className="flex justify-center">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <LucideAlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={result.selected} 
                              onCheckedChange={() => toggleResultSelection(idx)}
                              className={cn(
                                "h-5 w-5 rounded-md border-2",
                                inspectedIndex === idx ? "border-emerald-500 data-[state=checked]:bg-emerald-500" : "border-slate-200"
                              )}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions - Respecting Sidebar */}
          <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-width,256px)] z-50 bg-white/80 backdrop-blur-md border-t border-slate-100 p-6 animate-in slide-in-from-bottom-full duration-700 transition-all">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-8 w-full md:w-auto">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <LucideDollarSign className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 uppercase tracking-widest text-[9px]">Precio Total</h2>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{appliedRateInfo?.name || "Tarifa Base"}</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">$</span>
                      <Input
                        type="number"
                        className="h-12 bg-white border-slate-200 text-slate-900 text-xl font-black rounded-xl pl-8 w-32"
                        {...field}
                      />
                    </div>
                  )}
                />
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Confirmando</span>
                   <span className="text-2xl font-black text-emerald-600 leading-none">{selectedCount} Turnos</span>
                </div>

                <Button 
                  type="submit"
                  disabled={loading || selectedCount === 0}
                  className="h-14 px-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] w-full md:w-auto"
                >
                  {loading ? <LucideLoader2 className="h-5 w-5 animate-spin" /> : "Confirmar Reserva Fija"}
                </Button>
              </div>
            </div>
          </div>

        </form>
      </Form>
    </div>
  );
}
