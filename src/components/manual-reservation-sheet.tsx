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
  LucideMapPin
} from "lucide-react";
import { useReservationForm } from "@/hooks/use-reservation-form";
import { generateTimeSlots, isSlotBooked as checkSlotBooked } from "./courts-list";
import { CourtTimeGrid, TimeGridCourt } from "./court-time-grid";
import { getCourtsAction } from "@/lib/actions/court";
import { useState } from "react";

// Utilities
export const isSlotBooked = (court: any, time: string, dateStr: string) => {
  if (!court.bookings || !Array.isArray(court.bookings)) return false;

  const [h, m] = time.split(":").map(Number);
  const [y, mon, d] = dateStr.split("-").map(Number);
  const slotTime = new Date(y, mon - 1, d, h, m, 0, 0);

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
    if (open && initialSlot) {
      form.reset({
        reservationType: "single",
        guestName: "",
        courtId: "auto", // Always start in global mode for time selection
        startTimeStr: initialSlot.time,
        durationMins: 90,
        price: 15000,
        dateStr: globalDateStr || new Date().toISOString().split("T")[0],
      });
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
      <SheetContent className="overflow-y-auto transition-all duration-500 ease-in-out !w-[98vw] lg:!w-[98vw] lg:!max-w-[1800px] p-0 border-none shadow-2xl bg-slate-50/95 backdrop-blur-xl">
        <div className="flex flex-col h-full max-h-screen">

          <div className="flex-1 grid lg:grid-cols-3 h-full overflow-hidden">
            {/* Left Column: Smart Form */}
            <div className="border-r border-slate-300/80 bg-white p-6 overflow-y-auto custom-scrollbar">
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Reservation Type Selector */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl mb-6">
                    <button
                      type="button"
                      onClick={() => form.setValue("reservationType", "single")}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        watchReservationType === "single" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Simple
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("reservationType", "recurring");
                        form.setValue("courtId", "auto");
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        watchReservationType === "recurring" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Fija
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("reservationType", "block");
                        form.setValue("guestName", "Bloqueo Técnico");
                      }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        watchReservationType === "block" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Bloqueo
                    </button>
                  </div>
                  {/* Guest Info Section */}
                  {watchReservationType !== "block" && (
                    <FormField
                      control={form.control}
                      name="guestName"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Cliente / Referencia</FormLabel>
                          </div>
                          <FormControl>
                            <div className="relative group">
                              <Input
                                placeholder="Nombre del jugador..."
                                className="h-12 bg-white border-slate-300 text-base font-semibold focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-xl pl-4"
                                autoFocus
                                {...field}
                                value={field.value ?? ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Core Parameters Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateStr"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2 h-4">
                            <LucideCalendarDays className="h-3.5 w-3.5 shrink-0" />
                            {watchReservationType === "recurring" ? "Inicio" : "Fecha"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              style={{ width: '100%', height: '48px' }}
                              className="bg-slate-50 border-slate-200 font-bold text-slate-900 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500 transition-all px-4"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startTimeStr"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2 h-4">
                            <LucideLoader2 className="h-3.5 w-3.5 shrink-0" />
                            Horario
                          </FormLabel>
                          <Select
                            onValueChange={(val) => {
                              if (!val) return;
                              field.onChange(val);
                              // Sync with inspected row if in preview mode
                              if (inspectedIndex !== null && validationResults) {
                                const activeDateStr = inspectedDate || watchDateStr;
                                const [yyyy, mm, dd] = activeDateStr.split("-").map(Number);
                                const [h, m] = val.split(":").map(Number);
                                const newStartTime = new Date(yyyy, mm - 1, dd, h, m, 0, 0);
                                const currentDuration = form.getValues("durationMins");
                                const newEndTime = new Date(newStartTime.getTime() + currentDuration * 60000);

                                updateValidationRow(inspectedIndex, {
                                  startTime: newStartTime,
                                  endTime: newEndTime
                                });
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
                                style={{ width: '100%', height: '48px' }}
                                className="bg-slate-50 border-slate-200 font-bold text-slate-900 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500 transition-all px-4"
                              >
                                <SelectValue placeholder="Hora..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl shadow-xl border-slate-300">
                              {timeSlots.map((t) => (
                                <SelectItem key={t} value={t} className="font-medium">{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationMins"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2 h-4">
                            <LucideRepeat className="h-3.5 w-3.5 shrink-0" />
                            Duración
                          </FormLabel>
                          <Select
                            onValueChange={(val) => {
                              if (!val) return;
                              const mins = parseInt(val);
                              field.onChange(mins);
                              // Sync with inspected row if in preview mode
                              if (inspectedIndex !== null && validationResults) {
                                const startStr = form.getValues("startTimeStr");
                                if (startStr) {
                                  const activeDateStr = inspectedDate || watchDateStr;
                                  const [yyyy, mm, dd] = activeDateStr.split("-").map(Number);
                                  const [h, m] = startStr.split(":").map(Number);
                                  const newStartTime = new Date(yyyy, mm - 1, dd, h, m, 0, 0);
                                  const newEndTime = new Date(newStartTime.getTime() + mins * 60000);

                                  updateValidationRow(inspectedIndex, {
                                    startTime: newStartTime,
                                    endTime: newEndTime
                                  });
                                }
                              }
                            }}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger
                                style={{ width: '100%', height: '48px' }}
                                className="bg-slate-50 border-slate-200 font-bold text-slate-900 rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500 transition-all px-4"
                              >
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl shadow-xl border-slate-200">
                              {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map((mins) => (
                                <SelectItem key={mins} value={mins.toString()} className="font-medium">
                                  {mins} min
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2 h-4">
                            <LucideDollarSign className="h-3.5 w-3.5 shrink-0" />
                            Total
                          </FormLabel>
                          <FormControl>
                            <div className="relative" style={{ width: '100%', height: '48px' }}>
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-600">$</span>
                              <Input
                                type="number"
                                readOnly
                                style={{ width: '100%', height: '100%' }}
                                className="pl-10 pr-4 bg-slate-100/50 border-slate-200 font-bold text-slate-500 rounded-2xl cursor-default transition-all"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Recurring Details */}
                  {watchReservationType === "recurring" && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <FormField
                        control={form.control}
                        name="recurringEndDateStr"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Repetir Hasta</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-11 bg-white border-slate-200 font-semibold rounded-xl"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="recurringDays"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Días de la semana</FormLabel>
                            <div className="flex gap-2">
                              {[
                                { id: 1, label: "L" }, { id: 2, label: "M" }, { id: 3, label: "X" },
                                { id: 4, label: "J" }, { id: 5, label: "V" }, { id: 6, label: "S" }, { id: 0, label: "D" }
                              ].map(day => (
                                <button
                                  key={day.id}
                                  type="button"
                                  onClick={() => {
                                    const active = field.value || [];
                                    const next = active.includes(day.id)
                                      ? active.filter((d: number) => d !== day.id)
                                      : [...active, day.id];
                                    field.onChange(next);
                                  }}
                                  className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all border",
                                    field.value?.includes(day.id)
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                      : "bg-white border-slate-300 text-slate-700 hover:border-slate-400"
                                  )}
                                >
                                  {day.label}
                                </button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Applied Rate Info */}
                  {appliedRateInfo && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/50">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold tracking-tight">
                        {appliedRateInfo.name} • <span className="font-bold">${appliedRateInfo.price}/módulo</span>
                      </span>
                    </div>
                  )}

                  {/* Actions Area */}
                  <div className="pt-4 flex flex-col gap-4">
                    {!validationResults ? (
                      <div className="flex flex-col gap-3">
                        {(watchReservationType === "recurring" || watchReservationType === "single") && (
                          <Button
                            type="button"
                            onClick={onSimulateBatch}
                            disabled={isValidating || loading}
                            className="h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-slate-900/10 transition-all active:scale-95"
                          >
                            {isValidating ? (
                              <><LucideLoader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando...</>
                            ) : (
                              <><LucideSearch className="h-4 w-4 mr-2" /> Validar Disponibilidad</>
                            )}
                          </Button>
                        )}
                        {(watchReservationType === "single" || watchReservationType === "block") && (
                          <Button
                            type="submit"
                            disabled={loading}
                            className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
                          >
                            {loading ? (
                              <><LucideLoader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
                            ) : (
                              <><LucideCheckCircle2 className="h-4 w-4 mr-2" /> {watchReservationType === "block" ? "Confirmar Bloqueo" : "Confirmar Reserva"}</>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                        <Button
                          type="submit"
                          disabled={loading || selectedCount === 0 || hasConflictsInSelected}
                          className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                        >
                          {loading ? (
                            <><LucideLoader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                          ) : hasConflictsInSelected ? (
                            <><LucideAlertTriangle className="h-4 w-4 mr-2" /> Resuelve Conflictos</>
                          ) : selectedCount === 0 ? (
                            <><LucideSearch className="h-4 w-4 mr-2" /> Selecciona Fechas</>
                          ) : (
                            <><LucideCheckCircle2 className="h-4 w-4 mr-2" /> Finalizar {selectedCount} Reservas</>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={clearValidation}
                          className="h-11 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 rounded-xl"
                        >
                          Modificar Parámetros
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            </div>

            {/* Middle Column: Visual Interaction */}
            <div className="bg-white p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar border-r border-slate-300/80">
              {/* Visual Grid Section */}
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <LucideCalendarDays className="h-4 w-4 text-emerald-600" />
                      {inspectedIndex !== null ? `Cancha: ${gridCourt?.name}` : "Disponibilidad del Club"}
                      {isPreviewLoading && <LucideLoader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                    </h3>

                      {inspectedIndex !== null && validationResults && (
                        <p className={cn(
                          "text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1.5",
                          validationResults[inspectedIndex].status === 'conflict' ? "text-amber-600" : "text-emerald-600"
                        )}>
                          <span className={cn(
                            "h-1 w-1 rounded-full animate-pulse",
                            validationResults[inspectedIndex].status === 'conflict' ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                          {validationResults[inspectedIndex].status === 'conflict'
                            ? `Validando Conflicto: ${validationResults[inspectedIndex].dateStr}`
                            : `Inspeccionando: ${validationResults[inspectedIndex].dateStr}`
                          }
                        </p>
                      )}
                  </div>
                  {watchStartTime && (
                    <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-3 animate-in fade-in zoom-in-95">
                      <span className="text-lg font-black tracking-tight">{watchStartTime} — {endTime}</span>
                      <div className="h-4 w-px bg-white/20" />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase">{watchDuration}m</span>
                        <button
                          type="button"
                          onClick={() => {
                            // Si estamos inspeccionando una fila de resultados -> SOLO LIMPIAR ESA FILA
                            if (inspectedIndex !== null && validationResults) {
                              updateValidationRow(inspectedIndex, {
                                selected: false,
                                status: 'conflict',
                                courtName: 'Sin Selección'
                              });
                              // También limpiamos el form para feedback visual en la grilla
                              form.setValue("startTimeStr", "", { shouldDirty: true });
                            } else {
                              // Caso normal: Limpieza global del formulario
                              form.setValue("startTimeStr", "", { shouldDirty: true });
                              form.setValue("durationMins", 90, { shouldDirty: true });
                              clearValidation();
                            }
                          }}
                          className="h-5 w-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                        >
                          <LucideX className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-4 border border-slate-300 shadow-sm relative overflow-hidden min-h-[400px]">
                  {isPreviewLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                      <div className="h-10 w-10 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin shadow-lg" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando Disponibilidad...</span>
                    </div>
                  )}

                  <CourtTimeGrid
                    court={gridCourt}
                    isGlobalView={watchCourtId === "auto"}
                    allCourts={activeCourts}
                    timeSlots={timeSlots}
                    isSlotBooked={(c, t) => {
                      const dateStr = inspectedDate || watchDateStr;
                      if (watchCourtId === "auto") {
                        // Global view: A slot is 'booked' if ALL active courts are occupied
                        return activeCourts.length > 0 && activeCourts.every(court => isSlotBooked(court, t, dateStr));
                      }
                      // Single court view
                      if (!c || c.id === "auto") return false;
                      return isSlotBooked(c, t, dateStr);
                    }}
                    selectedTime={watchStartTime}
                    selectedDurationMins={form.watch("durationMins")}
                    onSlotClick={(clickedCourt, time, booked) => {
                      if (booked) return;

                      const parseHmMinsLocal = (t: string) => {
                        if (!t) return 0;
                        const [h, m] = t.split(":").map(Number);
                        return h * 60 + m;
                      };

                      const clickedMins = parseHmMinsLocal(time);
                      const currentStart = form.getValues("startTimeStr");
                      const currentDuration = form.getValues("durationMins");

                      let nextStart = currentStart;
                      let nextDuration = currentDuration;

                      if (!currentStart) {
                        nextStart = time;
                      } else if (time === currentStart) {
                        nextStart = "";
                      } else if (clickedMins > parseHmMinsLocal(currentStart) && clickedMins <= (parseHmMinsLocal(currentStart) + currentDuration + 60)) {
                        nextDuration = clickedMins - parseHmMinsLocal(currentStart) + 30;
                      } else {
                        nextStart = time;
                        nextDuration = 90;
                      }

                      // Caso A: No hay inspección -> Flujo estándar de nueva reserva
                      if (inspectedIndex === null) {
                        clearValidation();
                        form.setValue("startTimeStr", nextStart, { shouldValidate: true, shouldDirty: true });
                        form.setValue("durationMins", nextDuration, { shouldValidate: true, shouldDirty: true });
                        // We stay in 'auto' mode during the selection phase to show global availability
                        // form.setValue("courtId", clickedCourt.id, { shouldValidate: true, shouldDirty: true });
                      }
                      // Caso B: Estamos inspeccionando una fila de resultados -> MODIFICAR SOLO ESA FILA
                      else if (validationResults && nextStart) {
                        const activeDateStr = inspectedDate || watchDateStr;
                        const [yyyy, mm, dd] = activeDateStr.split("-").map(Number);
                        const [h, m] = nextStart.split(":").map(Number);
                        const newStartTime = new Date(yyyy, mm - 1, dd, h, m, 0, 0);
                        const newEndTime = new Date(newStartTime.getTime() + nextDuration * 60000);

                        updateValidationRow(inspectedIndex, {
                          startTime: newStartTime,
                          endTime: newEndTime,
                          courtId: clickedCourt.id,
                          courtName: clickedCourt.name
                        });

                        // Sincronizamos el form para feedback visual inmediato en la grilla
                        form.setValue("startTimeStr", nextStart, { shouldDirty: true });
                        form.setValue("durationMins", nextDuration, { shouldDirty: true });
                        form.setValue("courtId", clickedCourt.id, { shouldDirty: true });
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col items-center gap-5 mt-4">
                  <p className="text-[10px] text-center font-bold text-slate-500 uppercase tracking-widest">
                    Toca un bloque para iniciar • Toca un bloque posterior para extender
                  </p>

                  {watchCourtId === "auto" && activeCourts.length > 0 && (
                    <div className="bg-slate-50/80 border border-slate-200/60 px-5 py-3 rounded-2xl flex flex-wrap justify-center items-center gap-6 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 items-center bg-white p-1.5 px-2 rounded-lg border border-slate-100 shadow-sm">
                          {Array.from({ length: Math.min(3, activeCourts.length) }).map((_, i) => (
                            <div key={`green-${i}`} className="h-1.5 w-3.5 bg-emerald-500 rounded-full" />
                          ))}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none mb-1">Club Vacío</span>
                          <span className="text-[9px] font-bold text-slate-400 leading-none">Todas las canchas libres</span>
                        </div>
                      </div>

                      <div className="hidden sm:block w-px h-6 bg-slate-200" />

                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 items-center bg-white p-1.5 px-2 rounded-lg border border-slate-100 shadow-sm">
                          {Array.from({ length: Math.min(3, activeCourts.length) }).map((_, i) => (
                            <div key={`mix-${i}`} className={cn("h-1.5 w-3.5 rounded-full", i === 0 ? "bg-slate-300" : "bg-emerald-500")} />
                          ))}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none mb-1">Ocupación Parcial</span>
                          <span className="text-[9px] font-bold text-slate-400 leading-none">Gris = Ocupada, Verde = Libre</span>
                        </div>
                      </div>

                      <div className="hidden sm:block w-px h-6 bg-slate-200" />

                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 items-center bg-white p-1.5 px-2 rounded-lg border border-slate-100 shadow-sm">
                          {Array.from({ length: Math.min(3, activeCourts.length) }).map((_, i) => (
                            <div key={`gray-${i}`} className="h-1.5 w-3.5 bg-slate-300 rounded-full" />
                          ))}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-none mb-1">Club Lleno</span>
                          <span className="text-[9px] font-bold text-amber-600/70 leading-none">Sin canchas disponibles</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Results Section */}
            <div className="bg-slate-100/50 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              {/* Dynamic Results Section */}
              <div className={cn(
                "transition-all duration-500",
                validationResults ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              )}>
                {validationResults && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <LucideCheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Disponibilidad {watchReservationType === "recurring" ? "Proyectada" : "Confirmada"}
                      </h3>
                      <div className="flex gap-2">
                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                          {selectedCount} Seleccionadas
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[800px] overflow-y-auto custom-scrollbar border-t border-slate-200">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Fecha</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Estado</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Hora</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-700 uppercase tracking-widest text-right">#</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {validationResults.map((result, idx) => (
                            <tr
                              key={idx}
                              onClick={() => handleInspectRow(idx)}
                              className={cn(
                                "transition-all cursor-pointer hover:bg-slate-200/50",
                                !result.selected && "opacity-40 grayscale",
                                result.status === 'conflict' && "bg-amber-50/50",
                                inspectedIndex === idx && "bg-emerald-50 ring-1 ring-inset ring-emerald-500/20"
                              )}>
                                     {/* 1. FECHA */}
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {new Date(result.startTime).toLocaleDateString('es-AR', { weekday: 'long' })}
                                  </span>
                                  <span className="text-xs font-black text-slate-900">{result.dateStr}</span>
                                </div>
                              </td>

                              {/* 2. CANCHA / RESOLUCIÓN */}
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  {result.status === 'ok' ? (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Cancha Asignada</span>
                                      
                                      {result.alternatives.length > 0 ? (
                                        <Select onValueChange={(val) => {
                                          const alt = result.alternatives.find((a: any) => a.label === val);
                                          if (alt) {
                                            updateValidationRow(idx, alt);
                                            if (inspectedIndex === idx) {
                                              const s = new Date(alt.startTime);
                                              const e = new Date(alt.endTime);
                                              form.setValue("startTimeStr", s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
                                              form.setValue("durationMins", Math.round((e.getTime() - s.getTime()) / 60000));
                                              form.setValue("courtId", alt.courtId);
                                            }
                                          }
                                        }}>
                                          <SelectTrigger className="h-auto p-0 border-none bg-transparent shadow-none hover:bg-slate-100/50 rounded-lg -ml-1 px-1 w-full justify-start transition-all">
                                            <div className="flex items-center gap-2 text-xs font-black text-slate-900 truncate max-w-[150px]">
                                              {result.courtId === 'auto' ? 'Asignación Automática' : result.courtName}
                                              <LucideChevronDown className="h-3 w-3 text-slate-400" />
                                            </div>
                                          </SelectTrigger>
                                          <SelectContent className="rounded-2xl border-slate-200 shadow-2xl min-w-[320px] p-2 overflow-hidden bg-white/95 backdrop-blur-md">
                                            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-xl mb-2 border border-slate-100 flex items-center gap-2">
                                              <LucideClock className="h-3 w-3" />
                                              Sugerencias para el {result.dateStr}
                                            </div>
                                            <div className="space-y-1">
                                              {result.alternatives.map((alt: any, aIdx: number) => {
                                                const altDate = new Date(alt.startTime);
                                                const timeStr = altDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                return (
                                                  <SelectItem key={aIdx} value={alt.label} className="rounded-xl py-2.5 px-3 cursor-pointer">
                                                    <div className="flex items-center justify-between w-full gap-4">
                                                      <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                          <LucideClock className="h-4 w-4 text-slate-500" />
                                                        </div>
                                                        <div className="flex flex-col text-left">
                                                          <span className="text-[11px] font-black text-slate-900 leading-none mb-1">{timeStr}</span>
                                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{alt.courtName}</span>
                                                        </div>
                                                      </div>
                                                      <div className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider">
                                                        {100 - alt.usagePct}% Libre
                                                      </div>
                                                    </div>
                                                  </SelectItem>
                                                );
                                              })}
                                            </div>
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">
                                          {result.courtId === 'auto' ? 'Asignación Automática' : result.courtName}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Conflicto</span>
                                      {result.alternatives.length > 0 ? (
                                        <Select onValueChange={(val) => {
                                          const alt = result.alternatives.find((a: any) => a.label === val);
                                          if (alt) updateValidationRow(idx, alt);
                                        }}>
                                          <SelectTrigger className="h-auto p-0 border-none bg-transparent shadow-none hover:bg-amber-100/50 rounded-lg -ml-1 px-1 w-full justify-start transition-all">
                                            <span className="text-xs font-black text-amber-700 flex items-center gap-1.5">
                                              ⚠️ Todas Ocupadas
                                              <LucideChevronDown className="h-3 w-3 text-amber-400" />
                                            </span>
                                          </SelectTrigger>
                                          <SelectContent className="rounded-2xl border-slate-200 shadow-2xl min-w-[320px] p-2 overflow-hidden bg-white/95 backdrop-blur-md">
                                            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-xl mb-2 border border-slate-100 flex items-center gap-2">
                                              <LucideAlertTriangle className="h-3 w-3" />
                                              Resolución de Conflicto
                                            </div>
                                            <div className="space-y-1">
                                              {result.alternatives.map((alt: any, aIdx: number) => {
                                                const altDate = new Date(alt.startTime);
                                                const timeStr = altDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                return (
                                                  <SelectItem key={aIdx} value={alt.label} className="rounded-xl py-2.5 px-3 cursor-pointer">
                                                     <div className="flex items-center justify-between w-full gap-4">
                                                      <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                                          <LucideClock className="h-4 w-4 text-amber-600" />
                                                        </div>
                                                        <div className="flex flex-col text-left">
                                                          <span className="text-[11px] font-black text-slate-900 leading-none mb-1">{timeStr}</span>
                                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{alt.courtName}</span>
                                                        </div>
                                                      </div>
                                                      <div className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
                                                        Disponible
                                                      </div>
                                                    </div>
                                                  </SelectItem>
                                                );
                                              })}
                                            </div>
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <span className="text-xs font-black text-amber-700 truncate max-w-[120px]">⚠️ Todas Ocupadas</span>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="h-1 w-10 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full transition-all duration-700",
                                          result.usagePct > 80 ? "bg-red-500" : result.usagePct > 50 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${result.usagePct}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400">{result.usagePct}%</span>
                                  </div>
                                </div>
                              </td>

                              {/* 3. HORA */}
                              <td className="px-4 py-3">
                                <span className="text-xs font-black text-slate-900">
                                  {new Date(result.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>

                              {/* 4. SELECCIÓN */}
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleResultSelection(idx);
                                  }}
                                  className={cn(
                                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all ml-auto",
                                    result.selected
                                      ? (result.status === 'ok' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-amber-500 text-white shadow-lg shadow-amber-500/20 animate-pulse")
                                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                  )}
                                >
                                  {result.selected ? <LucideCheck className="h-4 w-4" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Batch Summary */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resumen de Operación</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{selectedCount} Sesiones</span>
                          <span className="text-[10px] font-bold text-slate-400">•</span>
                          {hasConflictsInSelected ? (
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter flex items-center gap-1">
                              <LucideAlertTriangle className="h-3 w-3" />
                              Hay conflictos seleccionados
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter flex items-center gap-1">
                              <LucideCheck className="h-3 w-3" />
                              Sin conflictos
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monto Total</span>
                        <div className="text-xl font-black text-slate-900 tracking-tight">
                          {formatArsCurrency(selectedCount * currentPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!validationResults && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-[40px] bg-white/30">
                  <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                    <LucideSearch className="h-8 w-8" />
                  </div>
                  <h4 className="text-slate-900 font-bold uppercase tracking-widest text-[10px] mb-2">Motor de Reserva Listo</h4>
                  <p className="text-slate-500 text-[10px] max-w-[240px] leading-relaxed">
                    Completa los datos y valida la disponibilidad para proyectar las reservas y resolver conflictos inteligentes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
