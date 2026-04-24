"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
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
  LucideCheckCircle2,
  LucideLoader2,
  LucideCalendarDays,
  LucideRepeat,
  LucideClock,
  LucideSparkles,
  LucideAlertTriangle,
  LucideCheck,
  LucideSearch,
  LucideX,
  LucideDollarSign,
  LucideChevronDown,
  LucideMapPin,
  Tag as LucideTag
} from "lucide-react";
import { useReservationForm } from "@/hooks/use-reservation-form";
import { generateTimeSlots, isSlotBooked as checkSlotBooked } from "./courts-list";
import { CourtTimeGrid, TimeGridCourt } from "./court-time-grid";
import { getCourtsAction } from "@/lib/actions/court";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

import { parseArgentineDate } from "@/lib/date-utils";

export const isSlotBooked = (court: any, time: string, dateStr: string, openTime?: string) => {
  if (!court.bookings || !Array.isArray(court.bookings)) return false;

  const slotTime = parseArgentineDate(dateStr, time, openTime);

  return court.bookings.some((b: any) => {
    try {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return slotTime >= bStart && slotTime < bEnd;
    } catch (e) { return false; }
  });
};

export const formatArsCurrency = (value: number): string => {
  if (isNaN(value)) return "$ 0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value).replace("ARS", "$");
};

interface ManualReservationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerId: string;
  center?: any;
  courts: TimeGridCourt[];
  initialSlot: { courtId: string; time: string } | null;
  openTime?: string;
  closeTime?: string;
  globalDateStr?: string;
}

export function ManualReservationSheet({
  open,
  onOpenChange,
  centerId,
  center,
  courts,
  initialSlot,
  openTime = "08:00",
  closeTime = "23:00",
  globalDateStr,
}: ManualReservationSheetProps) {
  const {
    form,
    onSubmit,
    loading,
    isValidating,
    validationResults,
    onSimulateBatch,
    updateValidationRow,
    toggleResultSelection,
    appliedRateInfo,
    clearValidation
  } = useReservationForm({
    onSuccess: () => onOpenChange(false),
    centerId,
    center,
    date: globalDateStr ? new Date(globalDateStr + "T12:00:00") : new Date(),
  });

  const selectedCount = validationResults?.filter((r: any) => r.selected).length || 0;
  const hasConflictsInSelected = validationResults?.some((r: any) => r.selected && r.status === 'conflict');

  // Preview state for inspecting specific dates/courts from results
  const [previewCourts, setPreviewCourts] = useState<TimeGridCourt[] | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null);
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);

  const calendarClassNames = {
    root: "w-full h-full flex flex-col",
    months: "flex-1 flex flex-col w-full relative justify-center",
    month: "flex flex-col items-center justify-center w-full h-full space-y-2 px-2",
    caption: "flex justify-center relative items-center w-full mb-4",
    caption_label: "text-lg font-black text-slate-900 uppercase tracking-[0.4em]",
    nav: "static",
    button_previous: cn(
      "absolute left-0 top-0 h-full w-5 bg-slate-50/80 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 z-10 border-r border-slate-100 rounded-none rounded-l-3xl p-0"
    ),
    button_next: cn(
      "absolute right-0 top-0 h-full w-5 bg-slate-50/80 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 z-10 border-l border-slate-100 rounded-none rounded-r-3xl p-0"
    ),
    table: "w-full border-collapse max-w-[340px]",
    head_row: "flex w-full justify-between mb-4",
    head_cell: "text-slate-400 rounded-md w-10 font-bold text-xs uppercase text-center",
    row: "flex w-full mt-2 justify-between",
    cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 flex justify-center",
    day: cn(
      "h-10 w-10 p-0 font-bold aria-selected:opacity-100 rounded-xl transition-all hover:bg-slate-100 flex items-center justify-center"
    ),
    day_selected:
      "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white focus:bg-emerald-600 focus:text-white shadow-lg shadow-emerald-600/20 scale-110",
    day_today: "bg-slate-100 text-slate-900 ring-2 ring-emerald-500/20",
    day_outside: "text-slate-300 opacity-30",
    day_disabled: "text-slate-300 opacity-30",
    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_hidden: "invisible",
  };

  // Clear preview state when validation results are cleared
  useEffect(() => {
    if (!validationResults) {
      setPreviewCourts(null);
      setInspectedIndex(null);
      setInspectedDate(null);
      form.setValue("courtId", "auto", { shouldDirty: true });
    }
  }, [validationResults, form]);

  // Pre-fill form when sheet opens with an initial slot
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split("T")[0];
      if (initialSlot) {
        form.reset({
          reservationType: "single",
          guestName: "",
          courtId: initialSlot.courtId, // Use the specific court if coming from the grid
          startTimeStr: initialSlot.time,
          durationMins: 90,
          price: 15000,
          dateStr: globalDateStr || today,
        });
      } else {
        form.reset({
          reservationType: "single",
          guestName: "",
          courtId: "auto",
          startTimeStr: "",
          durationMins: 90,
          price: 15000,
          dateStr: today,
        });
      }
    }
  }, [open, initialSlot, form, globalDateStr]);

  const watchCourtId = form.watch("courtId");
  const watchStartTime = form.watch("startTimeStr");
  const watchDuration = form.watch("durationMins");

  const endTime = (() => {
    if (!watchStartTime) return "--:--";
    const [h, m] = watchStartTime.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setMinutes(d.getMinutes() + watchDuration);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  })();

  const watchDateStr = form.watch("dateStr");
  const watchReservationType = form.watch("reservationType");
  const watchRecurringDays = form.watch("recurringDays") || [];

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
  const courtName = gridCourt?.name || "Cualquier";
  const currentPrice = form.watch("price") || 0;

  const handleInspectRow = async (idx: number) => {
    if (!validationResults) return;
    const result = validationResults[idx];
    setInspectedIndex(idx);

    // Extract ISO date YYYY-MM-DD from the startTime without timezone shifts
    const date = new Date(result.startTime);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    // Si es una fecha distinta a la del formulario, cargamos las canchas para ese día
    if (dateStr !== watchDateStr) {
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

    // Sincronizamos el formulario con los datos de esta fila para que la grilla visualice el bloque actual
    const startObj = new Date(result.startTime);
    const endObj = new Date(result.endTime);
    const timeStr = startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const duration = Math.round((endObj.getTime() - startObj.getTime()) / 60000);

    // Si la fila está en 'auto', la cambiamos a la primera cancha real para que no vea la grilla global (que confunde)
    if (result.courtId === 'auto' && courts.length > 0) {
      form.setValue("courtId", courts[0].id, { shouldDirty: true });
    } else {
      form.setValue("courtId", result.courtId, { shouldDirty: true });
    }
    form.setValue("startTimeStr", timeStr, { shouldDirty: true });
    form.setValue("durationMins", duration, { shouldDirty: true });
  };

  const timeSlots = generateTimeSlots(openTime, closeTime);

  return (
    <Sheet open={open} onOpenChange={(val) => {
      if (!val) {
        clearValidation();
        setPreviewCourts(null);
        setInspectedIndex(null);
      }
      onOpenChange(val);
    }}>
      <SheetContent className="overflow-hidden transition-all duration-500 ease-in-out !w-[95vw] lg:!max-w-[900px] p-0 border-none shadow-2xl bg-white rounded-l-[32px]">
        <div className="flex flex-col h-full max-h-screen overflow-hidden">
          <div className="px-8 py-5 bg-white border-b border-slate-100 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center size-11 rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-50">
                <LucideCalendarDays className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Nueva Reserva</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-600 uppercase tracking-wider border border-emerald-100">Manual</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">Configuración y Disponibilidad</p>
              </div>
            </div>
            <button 
              onClick={() => onOpenChange(false)} 
              className="group p-2.5 hover:bg-slate-50 rounded-2xl transition-all duration-300 text-slate-400 hover:text-slate-900 active:scale-95"
            >
              <LucideX className="size-5 transition-transform group-hover:rotate-90" />
            </button>
          </div>

          <div className="flex-1 grid lg:grid-cols-[380px_1fr] h-full overflow-hidden bg-slate-50/30">
            <div className="border-r border-slate-100 bg-white p-6 overflow-y-auto custom-scrollbar shadow-[10px_0_30px_-15px_rgba(0,0,0,0.03)] z-10">
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Selector de Tipo con diseño premium */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Modalidad de Reserva</label>
                    <div className="flex p-1.5 bg-slate-50 border border-slate-100 rounded-2xl">
                      <button 
                        type="button" 
                        onClick={() => form.setValue("reservationType", "single")} 
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-2", 
                          watchReservationType === "single" ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        <LucideCheck className={cn("size-3", watchReservationType === "single" ? "opacity-100" : "opacity-0")} />
                        Reserva Simple
                      </button>
                      <button 
                        type="button" 
                        onClick={() => form.setValue("reservationType", "block")} 
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-2", 
                          watchReservationType === "block" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        <LucideAlertTriangle className={cn("size-3", watchReservationType === "block" ? "opacity-100" : "opacity-0")} />
                        Bloqueo Técnico
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Selector de Cancha */}
                    <FormField control={form.control} name="courtId" render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Cancha Seleccionada</FormLabel>
                        <Select onValueChange={(val) => { if (val) { field.onChange(val); clearValidation(); } }} value={field.value ?? "auto"}>
                          <FormControl>
                            <SelectTrigger className="h-14 text-sm font-bold rounded-2xl border-slate-200 bg-white/50 hover:bg-white hover:border-emerald-500/50 hover:shadow-sm focus:ring-emerald-500/10 transition-all px-4 group">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                  <LucideMapPin className="size-4" />
                                </div>
                                <SelectValue placeholder="Seleccionar cancha">
                                  {field.value === "auto" 
                                    ? "Asignación Automática" 
                                    : courts.find(c => c.id === field.value)?.name || field.value}
                                </SelectValue>
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-[24px] border-slate-100 shadow-2xl p-2 min-w-[240px]">
                            <SelectItem value="auto" className="rounded-xl py-3 px-3 text-sm font-semibold focus:bg-emerald-50 focus:text-emerald-700">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                  <LucideSparkles className="size-4 text-emerald-500" />
                                </div>
                                <span>Asignación Automática</span>
                              </div>
                            </SelectItem>
                            <div className="h-px bg-slate-100 my-2 mx-2" />
                            {courts.map((c) => (
                              <SelectItem key={c.id} value={c.id} className="rounded-xl py-3 px-3 text-sm font-semibold focus:bg-emerald-50 focus:text-emerald-700 mb-1">
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-focus:text-emerald-600">
                                    <LucideMapPin className="size-4" />
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <span>{c.name}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />

                    {watchReservationType !== "block" && (
                      <FormField control={form.control} name="guestName" render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Información del Cliente</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Input 
                                placeholder="Nombre completo..." 
                                className="h-14 pl-14 text-sm font-semibold rounded-2xl border-slate-200 bg-white/50 hover:bg-white focus:border-emerald-500 focus:ring-emerald-500/10 transition-all duration-300" 
                                {...field} 
                                value={field.value ?? ""} 
                              />
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 size-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-focus-within:bg-emerald-50 group-focus-within:text-emerald-600 transition-all">
                                <LucideSearch className="size-4" />
                              </div>
                            </div>
                          </FormControl>
                        </FormItem>
                      )} />
                    )}
                  </div>

                  <div className="space-y-4">
                    <FormField control={form.control} name="dateStr" render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Fecha de Reserva</FormLabel>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button variant="outline" className="w-full h-14 justify-start text-left font-bold rounded-2xl border-slate-200 bg-white/50 hover:bg-white hover:border-emerald-500/50 hover:shadow-sm transition-all px-4 group">
                                <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors mr-3">
                                  <LucideCalendarDays className="size-4" />
                                </div>
                                {watchDateStr ? format(new Date(watchDateStr + 'T12:00:00'), "PPP", { locale: es }) : "Seleccionar fecha"}
                              </Button>
                            }
                          />
                          <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="start">
                            <Calendar 
                              mode="single" 
                              selected={watchDateStr ? new Date(watchDateStr + 'T12:00:00') : undefined} 
                              onSelect={(date: any) => { if (date) { form.setValue("dateStr", format(date, "yyyy-MM-dd"), { shouldDirty: true }); clearValidation(); } }} 
                              initialFocus 
                              locale={es} 
                              classNames={calendarClassNames as any}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="startTimeStr" render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Hora</FormLabel>
                          <Select onValueChange={(val) => { if (val) { field.onChange(val); clearValidation(); } }} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger className="h-14 text-sm font-bold rounded-2xl border-slate-200 bg-white/50 hover:bg-white hover:border-emerald-500/50 hover:shadow-sm focus:ring-emerald-500/10 px-4 group">
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                    <LucideClock className="size-4" />
                                  </div>
                                  <SelectValue placeholder="--:--" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-[24px] border-slate-100 shadow-2xl p-2 max-h-[300px]">
                              {timeSlots.map((t) => (
                                <SelectItem key={t} value={t} className="rounded-xl py-2.5 px-3 text-sm font-bold focus:bg-emerald-50 focus:text-emerald-700 mb-1">
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="durationMins" render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Duración</FormLabel>
                          <Select onValueChange={(val) => { if (val) { field.onChange(parseInt(val)); clearValidation(); } }} value={field.value?.toString() ?? ""}>
                            <FormControl>
                              <SelectTrigger className="h-14 text-sm font-bold rounded-2xl border-slate-200 bg-white/50 hover:bg-white hover:border-emerald-500/50 hover:shadow-sm focus:ring-emerald-500/10 px-4 group">
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                    <LucideRepeat className="size-4" />
                                  </div>
                                  <SelectValue placeholder="90 min">
                                    {field.value ? `${field.value} min` : "90 min"}
                                  </SelectValue>
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-[24px] border-slate-100 shadow-2xl p-2">
                              {[30, 60, 90, 120, 150, 180].map((m) => (
                                <SelectItem key={m} value={m.toString()} className="rounded-xl py-2.5 px-3 text-sm font-bold focus:bg-emerald-50 focus:text-emerald-700 mb-1">
                                  {m} min
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                      {/* 
                        Para reservas recurrentes mantenemos el flujo de simulación.
                        Para reservas simples o bloqueos, permitimos confirmación directa.
                      */}
                      {(watchReservationType === "single" || watchReservationType === "block") ? (
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                        >
                          {loading ? (
                            <LucideLoader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <LucideCheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                              <span className="tracking-tight">CONFIRMAR {watchReservationType === "block" ? "BLOQUEO" : "RESERVA"}</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        // Flujo para Reservas Recurrentes
                        !validationResults ? (
                          <Button 
                            type="button" 
                            onClick={onSimulateBatch}
                            disabled={isValidating}
                            className="w-full h-14 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                          >
                            {isValidating ? (
                              <LucideLoader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <LucideSparkles className="h-5 w-5 group-hover:rotate-12 transition-transform text-emerald-400" />
                                <span className="tracking-tight">CONSULTAR DISPONIBILIDAD</span>
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                              <LucideCheck className="size-4 shrink-0" />
                              Validación completada. Revisa los resultados antes de confirmar.
                            </div>
                            <Button 
                              type="submit" 
                              disabled={loading}
                              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                            >
                              {loading ? (
                                <LucideLoader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <>
                                  <LucideCheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                  <span className="tracking-tight">CONFIRMAR {validationResults.length} SESIONES</span>
                                </>
                              )}
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={clearValidation} 
                              className="w-full h-10 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl"
                            >
                              Modificar parámetros
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                </form>
              </Form>
            </div>

            <div className="p-8 flex flex-col h-full overflow-hidden">
              <div className="space-y-6 flex flex-col h-full">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Mapa de Disponibilidad</h3>
                  </div>
                  {watchStartTime && (
                    <div className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm animate-in fade-in zoom-in-95">
                      <LucideClock className="size-3.5 text-emerald-600" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-900 leading-none">{watchStartTime} — {endTime}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{watchDuration} minutos</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-0 bg-white rounded-[24px] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden relative group">
                  <div className="h-full overflow-y-auto p-4 custom-scrollbar bg-gradient-to-b from-white to-slate-50/30">
                    <CourtTimeGrid 
                      court={gridCourt} 
                      isGlobalView={watchCourtId === "auto"} 
                      allCourts={activeCourts} 
                      timeSlots={timeSlots} 
                      isSlotBooked={(c, t) => isSlotBooked(c, t, watchDateStr, openTime)}
                      selectedTime={watchStartTime} 
                      selectedDurationMins={watchDuration} 
                      onSlotClick={(c, t) => { 
                        form.setValue("courtId", c.id); 
                        form.setValue("startTimeStr", t); 
                      }} 
                    />
                  </div>
                </div>

                {/* Legend Premium */}
                <div className="flex items-center justify-between px-2 py-4 shrink-0 border-t border-slate-100/50 mt-auto">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="size-1 rounded-full bg-slate-300" />
                    Selección inteligente de turnos
                  </p>
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Libre</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-slate-200" />
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Ocupada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
