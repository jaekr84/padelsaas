"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  LucideShieldCheck,
  LucideEye,
  LucideCheckCircle2,
  LucideLayoutGrid
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
    clearValidation,
    updateValidationRow
  } = useReservationForm({
    onSuccess: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    centerId,
    center,
  });

  const [inspectingRow, setInspectingRow] = useState<{
    index: number;
    dateStr: string;
    courts: TimeGridCourt[];
    pendingTime?: string;
    pendingCourtId?: string;
  } | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const watchDateStr = form.watch("dateStr") || "";
  const watchRecurringEndDateStr = form.watch("recurringEndDateStr") || "";
  const watchRecurringDays = form.watch("recurringDays") || [];
  const watchCourtId = form.watch("courtId") || "auto";
  const watchStartTime = form.watch("startTimeStr") || "";
  const watchDuration = form.watch("durationMins") || 90;

  useEffect(() => {
    form.setValue("reservationType", "recurring");
  }, [form]);

  // Reactive date synchronization: Until = From + 7 days
  useEffect(() => {
    if (watchDateStr) {
      const startDate = new Date(watchDateStr + 'T12:00:00');
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      form.setValue("recurringEndDateStr", format(endDate, "yyyy-MM-dd"), { shouldDirty: true });
    }
  }, [watchDateStr, form]);

  const handleOpenInspector = async (idx: number, specificCourtId?: string) => {
    const result = validationResults![idx];
    const date = new Date(result.startTime);
    const dateStr = format(date, "yyyy-MM-dd");

    setIsModalLoading(true);
    setInspectingRow({
      index: idx,
      dateStr,
      courts: [],
      pendingCourtId: specificCourtId || (watchCourtId === 'auto' ? result.courtId : watchCourtId)
    });

    try {
      const fetchedCourts = await getCourtsAction(dateStr, centerId);
      setInspectingRow(prev => prev ? ({ ...prev, courts: fetchedCourts as any }) : null);
    } catch (error) {
      console.error("Error fetching courts for inspector:", error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const isRangeBooked = (court: TimeGridCourt, startTimeStr: string, durationMins: number, dateStr: string) => {
    if (!court.bookings) return false;

    const [h, m] = startTimeStr.split(":").map(Number);
    const rangeStartMins = h * 60 + m;
    const rangeEndMins = rangeStartMins + durationMins;

    return court.bookings.some((b: any) => {
      try {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        const bDateStr = bStart.toISOString().split('T')[0];
        if (bDateStr !== dateStr) return false;

        const bookingStartMins = bStart.getHours() * 60 + bStart.getMinutes();
        const bookingEndMins = bEnd.getHours() * 60 + bEnd.getMinutes();

        return (rangeStartMins < bookingEndMins) && (rangeEndMins > bookingStartMins);
      } catch (e) { return false; }
    });
  };

  const handleUpdateInstanceCourt = (idx: number, newCourtId: string) => {
    if (!validationResults) return;

    const instance = validationResults[idx];
    const targetCourt = courts.find(c => c.id === newCourtId);
    const startTimeStr = format(new Date(instance.startTime), "HH:mm");
    const dateStr = format(new Date(instance.startTime), "yyyy-MM-dd");

    const booked = targetCourt ? isRangeBooked(targetCourt, startTimeStr, watchDuration, dateStr) : false;

    updateValidationRow(idx, {
      courtId: newCourtId,
      status: booked ? 'conflict' : 'ok'
    });
  };

  const handleSlotClick = (court: TimeGridCourt, time: string) => {
    if (!inspectingRow) return;
    setInspectingRow(prev => prev ? ({ ...prev, pendingTime: time, pendingCourtId: court.id }) : null);
  };

  const handleApplyPendingChange = () => {
    if (!inspectingRow || !validationResults || !inspectingRow.pendingTime) return;

    const { index, pendingTime, pendingCourtId } = inspectingRow;
    const instance = validationResults[index];
    const [hours, minutes] = pendingTime.split(":").map(Number);

    const newStart = new Date(instance.startTime);
    newStart.setHours(hours, minutes, 0, 0);

    const newEnd = new Date(newStart);
    newEnd.setMinutes(newStart.getMinutes() + watchDuration);

    const finalCourtId = pendingCourtId === 'auto' ? instance.courtId : (pendingCourtId || instance.courtId);
    const targetCourt = courts.find(c => c.id === finalCourtId);
    const booked = targetCourt ? isRangeBooked(targetCourt, pendingTime, watchDuration, inspectingRow.dateStr) : false;

    updateValidationRow(index, {
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      courtId: finalCourtId,
      status: booked ? 'conflict' : 'ok'
    });

    setInspectingRow(null);
  };

  const timeSlots = generateTimeSlots(openTime, closeTime);
  const selectedCount = validationResults?.filter((r: any) => r.selected).length || 0;

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-12 pb-40 animate-in fade-in duration-700">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LucideRepeat className="h-6 w-6 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Gestión de Abonos</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Reservas Fijas</h1>
          <p className="text-slate-400 font-medium tracking-wide mt-2">Configuración masiva de horarios recurrentes para clientes fijos</p>
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
          Limpiar Todo
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-12">

          {/* 1. Configuration Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">1. Identidad</h2>
                </div>
                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cliente / Grupo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Torneo Miércoles"
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cancha de Preferencia</FormLabel>
                        <Select onValueChange={(val) => field.onChange(val || "")} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="w-full h-14 bg-slate-50/50 border-slate-100 text-slate-900 font-bold rounded-xl px-6 focus:bg-white transition-all shadow-sm shadow-slate-100/50">
                              <SelectValue placeholder="Seleccionar cancha..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="auto" className="font-bold text-emerald-600">Ocupación Automática (Mejor Libre)</SelectItem>
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

            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">2. Temporalidad</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateStr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Desde</FormLabel>
                          <Input type="date" className="h-14 bg-slate-50/50 border-slate-100 font-bold rounded-xl px-6" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurringEndDateStr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hasta</FormLabel>
                          <Input type="date" className="h-14 bg-slate-50/50 border-slate-100 font-bold rounded-xl px-6" {...field} value={field.value || ""} />
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
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hora Inicio</FormLabel>
                          <Select onValueChange={(val) => field.onChange(val || "")} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="w-full h-14 bg-slate-50/50 border-slate-100 font-bold rounded-xl px-6">
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
                              <SelectTrigger className="w-full h-14 bg-slate-50/50 border-slate-100 font-bold rounded-xl px-6">
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

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">3. Recurrencia</h2>
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
                        Buscar Disponibilidad
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Validation Matrix - NEW Professional UI */}
          {validationResults && (
            <div className="pt-12 border-t border-slate-100 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <LucideShieldCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Matriz de Disponibilidad</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Selecciona la cancha para cada turno. Si hay conflicto, usa el ojo para ver la grilla completa.</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <LucideCheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                      {validationResults.filter(r => r.status === 'ok').length} OK
                    </span>
                  </div>
                  {validationResults.filter(r => r.status === 'conflict').length > 0 && (
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                      <LucideAlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">
                        {validationResults.filter(r => r.status === 'conflict').length} Conflictos
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-xl shadow-slate-100/50">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 w-16 text-center">#</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100">Día / Fecha</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 text-center">Hora</th>
                      {courts.map(court => (
                        <th key={court.id} className="p-4 text-[10px] font-black uppercase text-slate-900 tracking-widest border-r border-slate-100 text-center min-w-[140px]">
                          {court.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validationResults.map((result, idx) => {
                      const startTime = format(new Date(result.startTime), "HH:mm");
                      const dateStr = format(new Date(result.startTime), "yyyy-MM-dd");

                      return (
                        <tr key={idx} className={cn("hover:bg-slate-50/50 transition-colors", result.status === 'conflict' && "bg-red-50/30")}>
                          <td className="p-4 text-center border-r border-slate-100">
                            <Checkbox
                              checked={result.selected}
                              onCheckedChange={() => toggleResultSelection(idx)}
                              className="h-5 w-5 rounded-md"
                            />
                          </td>
                          <td className="p-4 border-r border-slate-100">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-600">{format(new Date(result.startTime), "EEEE", { locale: es })}</span>
                              <span className="text-sm font-bold text-slate-900">{format(new Date(result.startTime), "dd MMMM", { locale: es })}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center border-r border-slate-100">
                            <span className="text-xs font-mono font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                              {startTime}
                            </span>
                          </td>
                          {courts.map(court => {
                            const isBusy = isRangeBooked(court, startTime, watchDuration, dateStr);
                            const isSelected = result.courtId === court.id;

                            return (
                              <td 
                                key={court.id} 
                                className={cn(
                                    "p-3 border-r border-slate-100 text-center transition-all",
                                    isSelected && !isBusy && "bg-emerald-500/10",
                                    isSelected && isBusy && "bg-red-500/10"
                                )}
                              >
                                <div className="flex items-center justify-center gap-2">
                                    {/* Occupancy Label - Left Side */}
                                    <span className="text-[9px] font-mono font-black text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200 shrink-0">
                                        {(result.courtUsages?.[court.id] || 0)}%
                                    </span>

                                    {isBusy ? (
                                        <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg bg-red-50 border border-red-100 min-w-[75px] justify-center">
                                            <LucideX className="h-2.5 w-2.5 text-red-500" />
                                            <span className="text-[7px] font-black text-red-600 uppercase tracking-tighter">Ocupado</span>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateInstanceCourt(idx, court.id);
                                            }}
                                            className={cn(
                                                "h-8 px-3 rounded-lg flex items-center justify-center transition-all min-w-[75px]",
                                                isSelected 
                                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                                                    : "bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                                            )}
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {isSelected ? "Elegida" : "Libre"}
                                            </span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenInspector(idx, court.id);
                                        }}
                                        className="h-8 w-8 rounded-lg bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 flex items-center justify-center transition-all shadow-sm shrink-0"
                                    >
                                        <LucideEye className="h-4 w-4" />
                                    </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conflict Resolution Modal */}
          <Dialog open={!!inspectingRow} onOpenChange={(open) => !open && setInspectingRow(null)}>
            <DialogContent className="sm:w-[650px] sm:max-w-none rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
              <div className="p-8 pb-4 bg-slate-50/50 border-b border-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                    <LucideLayoutGrid className="h-6 w-6 text-emerald-600" />
                    Inspección de Turno
                  </DialogTitle>
                  <DialogDescription className="font-medium text-slate-500 mt-2">
                    {inspectingRow && (
                      <span>
                        Disponibilidad para el <strong className="text-slate-900">{format(new Date(validationResults![inspectingRow.index].startTime), "EEEE dd 'de' MMMM", { locale: es })}</strong> a las <strong className="text-slate-900">{format(new Date(validationResults![inspectingRow.index].startTime), "HH:mm")}</strong>
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto bg-white">
                {isModalLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <LucideLoader2 className="h-10 w-10 animate-spin text-emerald-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando disponibilidad...</p>
                  </div>
                ) : inspectingRow && (
                  <div className="w-[500px] mx-auto animate-in fade-in zoom-in-95 duration-500">
                    <CourtTimeGrid
                      court={(inspectingRow.pendingCourtId && inspectingRow.pendingCourtId !== 'auto') ? (inspectingRow.courts.find(c => c.id === inspectingRow.pendingCourtId) || inspectingRow.courts[0]) : (watchCourtId === "auto" ? { id: 'auto', name: 'Global', bookings: inspectingRow.courts.flatMap(c => c.bookings) } as any : (inspectingRow.courts.find(c => c.id === watchCourtId) || inspectingRow.courts[0]))}
                      isGlobalView={!inspectingRow.pendingCourtId || inspectingRow.pendingCourtId === 'auto'}
                      allCourts={inspectingRow.courts}
                      timeSlots={timeSlots}
                      isSlotBooked={(c, t) => isRangeBooked(c, t, watchDuration, inspectingRow.dateStr)}
                      onSlotClick={handleSlotClick}
                      selectedTime={inspectingRow.pendingTime || format(new Date(validationResults![inspectingRow.index].startTime), "HH:mm")}
                      selectedDurationMins={watchDuration}
                    />
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setInspectingRow(null)}
                  className="h-12 rounded-xl font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 px-8"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={handleApplyPendingChange}
                  disabled={!inspectingRow?.pendingTime}
                  className={cn(
                    "h-12 rounded-xl font-black uppercase tracking-widest px-10 transition-all duration-300",
                    inspectingRow?.pendingTime
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 active:scale-95"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                  )}
                >
                  Confirmar Nuevo Horario
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Sticky Bottom Actions */}
          <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-width,256px)] z-50 bg-white/90 backdrop-blur-md border-t border-slate-100 p-6 animate-in slide-in-from-bottom-full duration-700 transition-all shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

              <div className="flex items-center gap-10 w-full md:w-auto">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
                    <LucideDollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 uppercase tracking-widest text-[9px]">Abono Total</h2>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{appliedRateInfo?.name || "Tarifa Fija"}</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">$</span>
                      <Input
                        type="number"
                        readOnly
                        className="h-12 bg-slate-50 border-slate-100 text-slate-500 text-xl font-black rounded-xl pl-8 w-36 shadow-none cursor-not-allowed select-none"
                        {...field}
                      />
                    </div>
                  )}
                />
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Total a Reservar</span>
                  <span className="text-3xl font-black text-emerald-600 leading-none tabular-nums">{selectedCount} Turnos</span>
                </div>

                <div className="text-right border-l border-slate-100 pl-8 hidden sm:block">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Monto Total</span>
                  <span className="text-3xl font-black text-slate-900 leading-none tabular-nums">
                    ${((form.watch("price") || 0) * selectedCount).toLocaleString('es-AR')}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={loading || selectedCount === 0}
                  className="h-14 px-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] w-full md:w-auto"
                >
                  {loading ? <LucideLoader2 className="h-5 w-5 animate-spin" /> : "Confirmar Batch de Reservas"}
                </Button>
              </div>
            </div>
          </div>

        </form>
      </Form>
    </div>
  );
}
