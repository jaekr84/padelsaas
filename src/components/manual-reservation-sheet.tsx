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
  LucideLock,
  LucideSparkles,
  LucideAlertTriangle,
  LucideCheck,
  LucideSearch,
  LucideX,
  LucideDollarSign
} from "lucide-react";
import { useReservationForm } from "@/hooks/use-reservation-form";
import { generateTimeSlots, isSlotBooked } from "./courts-list";
import { CourtTimeGrid, TimeGridCourt } from "./court-time-grid";

// Utilities
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

  // Pre-fill form when sheet opens with an initial slot
  useEffect(() => {
    if (open && initialSlot) {
      form.reset({
        reservationType: "single",
        guestName: "",
        courtId: initialSlot.courtId,
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
  const currentPrice = form.watch("price");

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

  const selectedCourt = courts.find((c) => c.id === watchCourtId);
  const courtName = watchCourtId === "auto" ? "Cualquier Cancha Diferida" : (selectedCourt?.name || "Selecciona una cancha");

  const timeSlots = generateTimeSlots(openTime, closeTime);

  return (
    <Sheet open={open} onOpenChange={(val) => {
      if (!val) clearValidation();
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={(val) => field.onChange(parseInt(val || "0"))} value={field.value?.toString()}>
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
                          className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
                        >
                          {loading ? (
                            <><LucideLoader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
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
                      Visualización de Horarios
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500">Cancha: {courtName}</p>
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
                            form.setValue("startTimeStr", "", { shouldDirty: true });
                            form.setValue("durationMins", 90, { shouldDirty: true });
                            clearValidation();
                          }}
                          className="h-5 w-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                        >
                          <LucideX className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-4 border border-slate-300 shadow-sm">
                  <CourtTimeGrid
                    court={selectedCourt || { id: "auto", name: "Cualquier", centerId: centerId, surface: "Panorámica", type: "Pádel", bookings: [] }}
                    timeSlots={timeSlots}
                    isSlotBooked={watchCourtId === "auto" ? () => false : isSlotBooked}
                    selectedTime={watchStartTime}
                    selectedDurationMins={form.watch("durationMins")}
                    onSlotClick={(_, time, booked) => {
                      if (booked) return;
                      clearValidation();

                      const parseHmMinsLocal = (t: string) => {
                        if (!t) return 0;
                        const [h, m] = t.split(":").map(Number);
                        return h * 60 + m;
                      };

                      const clickedMins = parseHmMinsLocal(time);
                      const currentStart = form.getValues("startTimeStr");
                      const currentDuration = form.getValues("durationMins");

                      if (!currentStart) {
                        form.setValue("startTimeStr", time, { shouldValidate: true, shouldDirty: true });
                        return;
                      }

                      const startMins = parseHmMinsLocal(currentStart);
                      const endMins = startMins + currentDuration;

                      // LÓGICA PRO:
                      // 1. Si clicamos el mismo inicio -> Limpiar
                      // 2. Si clicamos dentro del rango o inmediatamente después -> Extender/Ajustar duración
                      // 3. Si clicamos fuera (lejos o antes) -> Mover el inicio
                      if (time === currentStart) {
                        form.setValue("startTimeStr", "", { shouldValidate: true, shouldDirty: true });
                      } else if (clickedMins > startMins && clickedMins <= endMins + 60) {
                        const newDuration = clickedMins - startMins + 30;
                        form.setValue("durationMins", newDuration, { shouldValidate: true, shouldDirty: true });
                      } else {
                        // Clicking far away or before -> MOVE START
                        form.setValue("startTimeStr", time, { shouldValidate: true, shouldDirty: true });
                        // Siempre reseteamos a 90m al cambiar de bloque de inicio para cumplir con el estándar solicitado
                        form.setValue("durationMins", 90, { shouldValidate: true, shouldDirty: true });
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-center font-bold text-slate-700 uppercase tracking-widest">
                  Toca un bloque para iniciar • Toca un bloque posterior para extender
                </p>
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
                              <tr key={idx} className={cn(
                                "transition-all",
                                !result.selected && "opacity-40 grayscale",
                                result.status === 'conflict' && "bg-amber-50/50"
                              )}>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900">{result.dateStr}</span>
                                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Sábado</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]">{result.courtName}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full transition-all duration-700",
                                            result.usagePct > 80 ? "bg-red-500" : result.usagePct > 50 ? "bg-amber-500" : "bg-emerald-500"
                                          )}
                                          style={{ width: `${result.usagePct}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-black text-slate-900">
                                      {new Date(result.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {result.selected && result.alternatives.length > 0 && (
                                      <Select onValueChange={(val) => {
                                        const alt = result.alternatives.find((a: any) => a.label === val);
                                        if (alt) updateValidationRow(idx, alt);
                                      }}>
                                        <SelectTrigger className="h-7 text-[9px] bg-amber-50 border-amber-100 text-amber-700 font-bold rounded-lg px-2 shadow-none">
                                          <SelectValue placeholder="Alternativas" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200">
                                          {result.alternatives.map((alt: any, aIdx: number) => (
                                            <SelectItem key={aIdx} value={alt.label} className="text-[10px] font-bold">
                                              {alt.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => toggleResultSelection(idx)}
                                    className={cn(
                                      "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
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
