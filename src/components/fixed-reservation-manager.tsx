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
import { CustomerSelect } from "./customers/customer-select";

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
    <div className="pb-40">
      <Form {...form}>
        <form onSubmit={onSubmit}>
          {/* Main Content with Fade Animation */}
          <div className="max-w-[1600px] mx-auto p-6 space-y-10 animate-in fade-in duration-500">

            {/* Page Header Industrial */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-6 bg-blue-800" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-800">Terminal de Abonos</span>
                </div>
                <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">Gestión de Reservas Fijas</h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Configuración masiva de horarios recurrentes para clientes corporativos y fijos</p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearValidation();
                  form.reset();
                  form.setValue("reservationType", "recurring");
                }}
                className="h-10 rounded-none border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest px-6 hover:bg-slate-50 hover:text-slate-950 transition-all gap-2"
              >
                <LucideRotateCcw className="h-3.5 w-3.5" />
                Reiniciar Configuración
              </Button>
            </div>

            {/* 1. Configuration Section - Industrial Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200 p-6 space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <LucideUsers className="h-4 w-4 text-blue-800" />
                    <h2 className="text-[10px] font-black text-slate-950 uppercase tracking-widest">01. Identificación del Cliente</h2>
                  </div>
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="guestName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Titular de la Cuenta</FormLabel>
                          <FormControl>
                            <CustomerSelect 
                              defaultValue={form.getValues("customerId")}
                              onSelect={(customer) => {
                                form.setValue("customerId", customer.id);
                                form.setValue("guestName", `${customer.firstName} ${customer.lastName}`);
                              }}
                              className="bg-slate-50 border-slate-200 rounded-none h-12 font-bold uppercase text-xs"
                              placeholder={field.value || "SELECCIONAR CLIENTE..."}
                            />
                          </FormControl>
                          <FormMessage className="text-[9px] ml-1 font-bold uppercase" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="courtId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Cancha Preferencial</FormLabel>
                          <Select 
                            key={`court-select-${courts.length}`}
                            onValueChange={(val) => field.onChange(val || "")} 
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200 text-slate-950 font-black uppercase text-[10px] rounded-none px-4 focus:ring-0 focus:border-blue-800 transition-all">
                                <SelectValue placeholder="SELECCIONAR CANCHA...">
                                  {field.value === "auto" ? (
                                    <span className="font-black text-blue-800">OCUPACIÓN AUTOMÁTICA</span>
                                  ) : (
                                    courts.find(c => c.id === field.value)?.name || field.value
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none border-slate-200 shadow-2xl">
                              <SelectItem value="auto" className="font-black text-blue-800 uppercase text-[10px]">Ocupación Automática (Heurística)</SelectItem>
                              {courts.map((court) => (
                                <SelectItem key={court.id} value={court.id} className="font-bold uppercase text-[10px]">
                                  {court.name}
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

              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                  <div className="bg-white border border-slate-200 p-6 space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <LucideClock className="h-4 w-4 text-blue-800" />
                      <h2 className="text-[10px] font-black text-slate-950 uppercase tracking-widest">02. Parámetros Temporales</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateStr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Desde</FormLabel>
                            <Input type="date" className="h-12 bg-slate-50 border-slate-200 font-black rounded-none px-4 text-xs" {...field} />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="recurringEndDateStr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Hasta</FormLabel>
                            <Input type="date" className="h-12 bg-slate-50 border-slate-200 font-black rounded-none px-4 text-xs" {...field} value={field.value || ""} />
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
                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Hora Inicio</FormLabel>
                            <Select onValueChange={(val) => field.onChange(val || "")} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200 font-black rounded-none px-4 text-[10px]">
                                  <SelectValue placeholder="HORA..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px] rounded-none shadow-2xl">
                                {timeSlots.map(t => <SelectItem key={t} value={t} className="font-bold text-[10px]">{t} HS</SelectItem>)}
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
                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Duración</FormLabel>
                            <Select onValueChange={(val) => field.onChange(parseInt(val || "0"))} value={field.value ? String(field.value) : ""}>
                              <FormControl>
                                <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200 font-black rounded-none px-4 text-[10px]">
                                  <SelectValue placeholder="MINS..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-none shadow-2xl">
                                {[60, 90, 120, 150, 180].map(m => <SelectItem key={m} value={m.toString()} className="font-bold text-[10px] uppercase">{m} MINUTOS</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-6 space-y-6 flex flex-col">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <LucideRepeat className="h-4 w-4 text-blue-800" />
                      <h2 className="text-[10px] font-black text-slate-950 uppercase tracking-widest">03. Ciclo de Recurrencia</h2>
                    </div>
                    <FormField
                      control={form.control}
                      name="recurringDays"
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2 py-2 flex-1 items-start content-start">
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
                                  "h-10 w-10 rounded-none flex items-center justify-center text-[10px] font-black transition-all border",
                                  active
                                    ? "bg-slate-950 border-slate-950 text-white"
                                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600"
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
                      className="w-full h-12 rounded-none bg-blue-800 hover:bg-blue-900 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                    >
                      {isValidating ? <LucideLoader2 className="h-4 w-4 animate-spin" /> : (
                        <>
                          <LucideSearch className="h-4 w-4 mr-2" />
                          Analizar Disponibilidad
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Validation Matrix - Accounting Industrial Style */}
            {validationResults && (
              <div className="pt-10 border-t border-slate-200 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-950 flex items-center justify-center text-white">
                      <LucideShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">Matriz de Validación Operativa</h2>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-0.5">Auditoría de conflictos y asignación de recursos por fecha</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 border border-slate-200">
                      <LucideCheckCircle2 className="h-3.5 w-3.5 text-blue-800" />
                      <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">
                        {validationResults.filter(r => r.status === 'ok').length} VALIDADO
                      </span>
                    </div>
                    {validationResults.filter(r => r.status === 'conflict').length > 0 && (
                      <div className="flex items-center gap-2 bg-blue-800 px-3 py-2 border border-blue-900">
                        <LucideAlertTriangle className="h-3.5 w-3.5 text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                          {validationResults.filter(r => r.status === 'conflict').length} CONFLICTOS
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 bg-white overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-[9px] font-black uppercase text-slate-950 tracking-widest border-r border-slate-200 w-12 text-center">SEL</th>
                        <th className="p-3 text-[9px] font-black uppercase text-slate-950 tracking-widest border-r border-slate-200 text-left pl-6">Fecha / Registro</th>
                        <th className="p-3 text-[9px] font-black uppercase text-slate-950 tracking-widest border-r border-slate-200 text-center w-24">Horario</th>
                        {courts.map(court => (
                          <th key={court.id} className="p-3 text-[9px] font-black uppercase text-slate-950 tracking-widest border-r border-slate-200 text-center min-w-[150px]">
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
                          <tr 
                            key={idx} 
                            className={cn(
                              "hover:bg-slate-50 transition-colors h-14", 
                              result.status === 'conflict' 
                                ? "bg-slate-50/50" 
                                : ""
                            )}
                          >
                            <td className="p-3 text-center border-r border-slate-100">
                              <Checkbox
                                checked={result.selected}
                                onCheckedChange={() => toggleResultSelection(idx)}
                                className="h-4 w-4 rounded-none border-slate-300 data-[state=checked]:bg-blue-800 data-[state=checked]:border-blue-800"
                              />
                            </td>
                            <td className="p-3 border-r border-slate-100 pl-6">
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black uppercase text-slate-400 w-16">{format(new Date(result.startTime), "EEE", { locale: es })}</span>
                                <span className="text-xs font-black text-slate-950 uppercase tabular-nums">{format(new Date(result.startTime), "dd MMM yyyy", { locale: es })}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center border-r border-slate-100">
                              <span className="text-[10px] font-black text-blue-800 bg-blue-50 px-2 py-1 border border-blue-100 tabular-nums">
                                {startTime} HS
                              </span>
                            </td>
                            {courts.map(court => {
                              const isBusy = isRangeBooked(court, startTime, watchDuration, dateStr);
                              const isSelected = result.courtId === court.id;

                              return (
                                <td 
                                  key={court.id} 
                                  className={cn(
                                      "p-2 border-r border-slate-100 text-center transition-all",
                                      isSelected && !isBusy && "bg-blue-800/5",
                                      isSelected && isBusy && "bg-slate-900/5"
                                  )}
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                      <span className="text-[8px] font-black text-slate-400 tabular-nums">
                                          {(result.courtUsages?.[court.id] || 0)}%
                                      </span>

                                      {isBusy ? (
                                          <div className="flex items-center gap-1 h-7 px-2 bg-slate-100 border border-slate-200 min-w-[80px] justify-center">
                                              <LucideX className="h-2.5 w-2.5 text-slate-400" />
                                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">OCUPADO</span>
                                          </div>
                                      ) : (
                                          <button
                                              type="button"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleUpdateInstanceCourt(idx, court.id);
                                              }}
                                              className={cn(
                                                  "h-7 px-3 rounded-none flex items-center justify-center transition-all min-w-[80px] border",
                                                  isSelected 
                                                      ? "bg-blue-800 border-blue-900 text-white font-black" 
                                                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600 font-bold"
                                              )}
                                          >
                                              <span className="text-[8px] uppercase tracking-widest">
                                                  {isSelected ? "ASIGNADA" : "LIBRE"}
                                              </span>
                                          </button>
                                      )}
                                      <button
                                          type="button"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenInspector(idx, court.id);
                                          }}
                                          className="h-7 w-7 rounded-none bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-800 hover:border-blue-800 flex items-center justify-center transition-all"
                                      >
                                          <LucideEye className="h-3.5 w-3.5" />
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

            {/* Conflict Resolution Modal - Industrial */}
            <Dialog open={!!inspectingRow} onOpenChange={(open) => !open && setInspectingRow(null)}>
              <DialogContent className="sm:max-w-[700px] rounded-none p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white">
                <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
                  <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <LucideLayoutGrid className="h-5 w-5 text-blue-500" />
                      Auditoría de Disponibilidad
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {inspectingRow && (
                        <span>
                          Análisis para el <span className="text-white">{format(new Date(validationResults![inspectingRow.index].startTime), "dd MMMM yyyy", { locale: es })}</span> a las <span className="text-white">{format(new Date(validationResults![inspectingRow.index].startTime), "HH:mm")} HS</span>
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <button type="button" onClick={() => setInspectingRow(null)} className="h-10 w-10 flex items-center justify-center hover:bg-slate-800 transition-colors">
                    <LucideX className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-8 bg-slate-50">
                  {isModalLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <LucideLoader2 className="h-8 w-8 animate-spin text-blue-800" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sincronizando grilla operativa...</p>
                    </div>
                  ) : inspectingRow && (
                    <div className="w-full flex justify-center animate-in fade-in duration-300">
                      <div className="bg-white border border-slate-200 p-6 shadow-sm w-full max-w-[500px]">
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
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border-t border-slate-200 flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setInspectingRow(null)}
                    className="h-11 rounded-none font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-950 px-8"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    onClick={handleApplyPendingChange}
                    disabled={!inspectingRow?.pendingTime}
                    className={cn(
                      "h-11 rounded-none font-black uppercase tracking-widest text-[10px] px-10 transition-all",
                      inspectingRow?.pendingTime
                        ? "bg-blue-800 hover:bg-blue-900 text-white"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    Aplicar Corrección
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Sticky Bottom Actions - OUTSIDE the animated div to avoid containing block issues */}
          <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-width,256px)] z-50 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-0">

              <div className="flex items-stretch gap-0 w-full md:w-auto">
                <div className="flex items-center gap-4 px-8 py-4 border-r border-slate-100">
                  <div className="h-10 w-10 bg-slate-950 flex items-center justify-center text-white">
                    <LucideDollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-950 uppercase tracking-widest text-[9px]">Tarifa Aplicada</h2>
                    <p className="text-[8px] text-blue-800 font-bold uppercase tracking-widest mt-0.5">{appliedRateInfo?.name || "LISTA GENERAL"}</p>
                  </div>
                </div>

                <div className="px-8 py-4 flex items-center border-r border-slate-100 bg-slate-50/50">
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">ARS</span>
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <Input
                          type="number"
                          readOnly
                          className="h-10 bg-transparent border-none text-slate-950 text-xl font-black rounded-none pl-10 w-32 shadow-none cursor-default focus-visible:ring-0"
                          {...field}
                        />
                      )}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-tighter">/ UNIDAD</span>
                </div>
              </div>

              <div className="flex items-stretch gap-0 w-full md:w-auto">
                <div className="px-8 py-4 text-right border-l border-slate-100 flex flex-col justify-center">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-0.5">Volumen</span>
                  <span className="text-2xl font-black text-blue-800 leading-none tabular-nums">{selectedCount} <span className="text-[10px] font-normal">MÓDULOS</span></span>
                </div>

                <div className="px-10 py-4 text-right border-l border-slate-100 flex flex-col justify-center min-w-[200px] bg-slate-50/30">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-0.5">Total Contrato</span>
                  <span className="text-2xl font-black text-slate-950 leading-none tabular-nums">
                    ${((form.watch("price") || 0) * selectedCount).toLocaleString('es-AR')}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={loading || selectedCount === 0}
                  className="h-auto px-12 rounded-none bg-blue-800 hover:bg-blue-900 text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all w-full md:w-64 border-l border-blue-900 shadow-none"
                >
                  {loading ? <LucideLoader2 className="h-5 w-5 animate-spin" /> : "Confirmar Abono"}
                </Button>
              </div>
            </div>
          </div>

        </form>
      </Form>
    </div>
  );
}
