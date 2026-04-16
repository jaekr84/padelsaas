"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  LucideSearch
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
    clearValidation
  } = useReservationForm({
    onSuccess: () => onOpenChange(false),
    centerId,
    date: globalDateStr ? new Date(globalDateStr + "T12:00:00") : new Date(),
  });

  // Pre-fill form when sheet opens with an initial slot
  useEffect(() => {
    if (open && initialSlot) {
      form.reset({
        guestName: "",
        courtId: initialSlot.courtId,
        startTimeStr: initialSlot.time,
        durationMins: 90,
        price: 15000, // Default price example, usually you'd calculate this
      });
    }
  }, [open, initialSlot, form]);

  const watchCourtId = form.watch("courtId");
  const watchStartTime = form.watch("startTimeStr");
  const currentPrice = form.watch("price");

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
      <SheetContent className={`overflow-y-auto transition-all duration-500 ease-in-out ${validationResults ? "!max-w-[100vw] sm:!max-w-[95vw] lg:!max-w-[1400px]" : "!max-w-[100vw] sm:!max-w-[80vw] md:!max-w-[750px] lg:!max-w-[900px]"} w-full p-6 sm:p-8`}>
        <SheetHeader className="mb-6 mt-4">
          <SheetTitle className="text-2xl font-black uppercase tracking-tighter">
            Nueva Reserva
          </SheetTitle>
          <SheetDescription className="font-medium text-muted-foreground uppercase text-xs">
            Reserva manual para {courtName} a las {form.watch("startTimeStr")}
          </SheetDescription>
        </SheetHeader>

        <div className={`grid gap-8 transition-all duration-500 ${validationResults ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {/* Left Column: Form */}
          <div className="flex flex-col space-y-6">
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-6">

                {/* Reservation Type Selector */}
                <div className="bg-muted p-1 rounded-lg flex space-x-1 mb-6">
                  <Button
                    type="button"
                    variant={watchReservationType === "single" ? "default" : "ghost"}
                    className={`flex-1 text-xs font-bold tracking-wider ${watchReservationType !== "single" && "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => form.setValue("reservationType", "single")}
                  >
                    <LucideCalendarDays className="h-4 w-4 mr-2" />
                    Simple
                  </Button>
                  <Button
                    type="button"
                    variant={watchReservationType === "recurring" ? "default" : "ghost"}
                    className={`flex-1 text-xs font-bold tracking-wider ${watchReservationType !== "recurring" && "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => {
                      form.setValue("reservationType", "recurring");
                      form.setValue("courtId", "auto");
                    }}
                  >
                    <LucideRepeat className="h-4 w-4 mr-2" />
                    Fija
                  </Button>
                  <Button
                    type="button"
                    variant={watchReservationType === "block" ? "default" : "ghost"}
                    className={`flex-1 text-xs font-bold tracking-wider ${watchReservationType !== "block" && "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => {
                      form.setValue("reservationType", "block");
                      form.setValue("guestName", "Bloqueo Técnico");
                    }}
                  >
                    <LucideLock className="h-4 w-4 mr-2" />
                    Bloqueo
                  </Button>
                </div>

                {watchReservationType !== "block" && (
                  <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs font-bold tracking-wider">Cliente / Referencia</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan Pérez"
                            className="font-medium"
                            autoFocus
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex flex-col space-y-6">
                  <FormField
                    control={form.control}
                    name="dateStr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs font-bold tracking-wider">
                          {watchReservationType === "recurring" ? "Fecha de Inicio" : "Fecha de Reserva"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="w-full flex-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchReservationType === "recurring" && (
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/10 space-y-4">
                      <FormField
                        control={form.control}
                        name="recurringEndDateStr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-xs font-bold tracking-wider">Repetir Hasta (Fecha final)</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="w-full"
                                {...field}
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
                          <FormItem>
                            <FormLabel className="uppercase text-xs font-bold tracking-wider mb-2 block">Días de la semana</FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { id: 1, label: "L" },
                                { id: 2, label: "M" },
                                { id: 3, label: "X" },
                                { id: 4, label: "J" },
                                { id: 5, label: "V" },
                                { id: 6, label: "S" },
                                { id: 0, label: "D" },
                              ].map(day => (
                                <Button
                                  key={day.id}
                                  type="button"
                                  onClick={() => {
                                    const active = field.value || [];
                                    const next = active.includes(day.id)
                                      ? active.filter(d => d !== day.id)
                                      : [...active, day.id];
                                    field.onChange(next);
                                  }}
                                  variant={field.value?.includes(day.id) ? "default" : "outline"}
                                  className={`h-10 w-10 p-0 rounded-full font-bold ${field.value?.includes(day.id) ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                                >
                                  {day.label}
                                </Button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {watchReservationType !== "recurring" && (
                    <FormField
                      control={form.control}
                      name="courtId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-xs font-bold tracking-wider">Cancha</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full h-auto min-h-10 text-left">
                                <SelectValue placeholder="Seleccionar">
                                  {field.value ? (
                                    <span className="whitespace-normal break-words line-clamp-2">
                                      {courts.find(c => c.id === field.value)?.name}
                                    </span>
                                  ) : undefined}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent alignItemWithTrigger={false} side="bottom" className="max-h-60 w-[var(--anchor-width)]">
                              <SelectItem value="auto" className="py-2.5 cursor-pointer whitespace-normal h-auto border-b bg-emerald-500/5 mb-1 text-emerald-800">
                                <span className="line-clamp-2 leading-relaxed font-bold">🔄 Cualquier Cancha Fija</span>
                              </SelectItem>
                              {courts.map((c) => (
                                <SelectItem key={c.id} value={c.id} className="py-2.5 cursor-pointer whitespace-normal h-auto">
                                  <span className="line-clamp-2 leading-relaxed font-medium">{c.name}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="startTimeStr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs font-bold tracking-wider">Inicio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="00:00">
                                {field.value || undefined}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent alignItemWithTrigger={false} side="bottom" className="max-h-60 w-[var(--anchor-width)]">
                            {Array.from({ length: 48 }).map((_, i) => {
                              const h = Math.floor(i / 2).toString().padStart(2, "0");
                              const m = i % 2 === 0 ? "00" : "30";
                              const t = `${h}:${m}`;
                              return <SelectItem key={t} value={t} className="cursor-pointer">{t}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={form.control}
                    name="durationMins"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs font-bold tracking-wider">Duración (Fin)</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val || "0"))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar">
                                {field.value} min
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent alignItemWithTrigger={false} side="bottom" className="max-h-60 w-[var(--anchor-width)]">
                            {[30, 60, 90, 120, 150, 180].map((mins) => {
                              return (
                                <SelectItem key={mins} value={mins.toString()} className="cursor-pointer">
                                  {mins} minutos
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                {watchReservationType === "recurring" && !validationResults ? (
                  <Button
                    type="button"
                    onClick={onSimulateBatch}
                    disabled={isValidating}
                    className="w-full h-12 uppercase font-black tracking-widest mt-8 transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isValidating ? (
                      <>
                        <LucideLoader2 className="h-5 w-5 mr-2 animate-spin" />
                        Simulando...
                      </>
                    ) : (
                      <>
                        <LucideSearch className="h-5 w-5 mr-2" />
                        Simular Disponibilidad
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || (watchReservationType === "recurring" && validationResults?.some(r => r.status === 'conflict'))}
                    className="w-full h-12 uppercase font-black tracking-widest mt-8 transition-all"
                  >
                    {loading ? (
                      <>
                        <LucideLoader2 className="h-5 w-5 mr-2 animate-spin" />
                        Procesando
                      </>
                    ) : (
                      <>
                        <LucideCheckCircle2 className="h-5 w-5 mr-2" />
                        {watchReservationType === "recurring" ? "Confirmar Todo" : "Confirmar Reserva"}
                      </>
                    )}
                  </Button>
                )}
              </form>
            </Form>
          </div>

          {/* Column 2: Court Visual Grid */}
          <div className={`transition-all duration-500 ${validationResults ? "w-full lg:border-l lg:pl-8 border-border" : "lg:border-l lg:pl-8 border-border"}`}>
            {selectedCourt || watchCourtId === "auto" ? (
              <div className="flex flex-col h-full space-y-4">
                <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10 h-full flex flex-col">
                  <div className="mb-4 flex flex-col gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-800 leading-relaxed">
                      {watchCourtId === "auto" ? "Grilla Diferida (Auto Asignación)" : `Grilla de ${selectedCourt?.name}`}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-white/80 px-3 py-1.5 rounded-md shadow-sm text-sm font-black text-emerald-900 border border-emerald-500/10">
                        Hora: {watchStartTime || "--:--"}
                      </span>
                      <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-md shadow-sm text-sm font-black">
                        {form.watch("durationMins")} min
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/40 p-3 rounded-md shadow-inner">
                    <CourtTimeGrid
                      court={selectedCourt || { id: "auto", name: "Cualquier", centerId: centerId, surface: "Panorámica", type: "Pádel", bookings: [] }}
                      timeSlots={timeSlots}
                      isSlotBooked={watchCourtId === "auto" ? () => false : isSlotBooked}
                      selectedTime={watchStartTime}
                      selectedDurationMins={form.watch("durationMins")}
                      onSlotClick={(_, time, booked) => {
                        if (booked) return;
                        const currentStart = form.getValues("startTimeStr");
                        const currentDuration = form.getValues("durationMins");

                        const parseHmMins = (t: string) => {
                          const [h, m] = t.split(":").map(Number);
                          return h * 60 + m;
                        };

                        if (!currentStart) {
                          form.setValue("startTimeStr", time, { shouldValidate: true, shouldDirty: true });
                          form.setValue("durationMins", 30, { shouldValidate: true, shouldDirty: true });
                          return;
                        }

                        const clickedMins = parseHmMins(time);
                        const currentStartMins = parseHmMins(currentStart);

                        if (clickedMins > currentStartMins) {
                          // User clicked a block after the start time -> EXTEND duration
                          const newDuration = clickedMins - currentStartMins + 30; // +30 so it includes the clicked block

                          // Check if it hits any already-booked block in between
                          let valid = true;
                          for (let m = currentStartMins; m <= clickedMins; m += 30) {
                            const hs = Math.floor(m / 60).toString().padStart(2, '0');
                            const ms = (m % 60) === 0 ? '00' : '30';
                            if (watchCourtId !== "auto" && selectedCourt && isSlotBooked(selectedCourt, `${hs}:${ms}`)) {
                              valid = false;
                              break;
                            }
                          }

                          if (valid) {
                            form.setValue("durationMins", newDuration, { shouldValidate: true, shouldDirty: true });
                          } else {
                            // Obstacle hit -> reset to this new single block
                            form.setValue("startTimeStr", time, { shouldValidate: true, shouldDirty: true });
                            form.setValue("durationMins", 30, { shouldValidate: true, shouldDirty: true });
                          }
                        } else {
                          // Clicked an earlier or identical block -> reset
                          form.setValue("startTimeStr", time, { shouldValidate: true, shouldDirty: true });
                          form.setValue("durationMins", 30, { shouldValidate: true, shouldDirty: true });
                        }
                      }}
                    />
                  </div>
                  <div className="mt-auto pt-6 px-2 text-center">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                      Haz clic en los bloques libres para pre-seleccionar la hora
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-muted">
                <p className="text-sm font-bold uppercase tracking-widest mb-2">Sin cancha seleccionada</p>
                <p className="text-xs max-w-[200px]">Elige una cancha del menú para visualizar sus horarios en tiempo real aquí mismo.</p>
              </div>
            )}
          </div>

          {/* Column 3: Validation Table (Only for Recurring) */}
          {validationResults && (
            <div className="flex flex-col h-full min-h-[400px] border-l pl-8 border-border">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center">
                  <LucideSparkles className="h-4 w-4 mr-2 text-amber-500" />
                  Pre-Chequeo de Fechas
                </h3>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                  {validationResults.length} FECHAS
                </span>
              </div>

              <div className="flex-1 border rounded-xl overflow-hidden bg-white shadow-sm flex flex-col h-full max-h-[600px]">
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-muted/50 backdrop-blur-md z-10">
                      <tr className="border-b">
                        <th className="p-3 text-[10px] font-black uppercase tracking-wider opacity-60">Fecha</th>
                        <th className="p-3 text-[10px] font-black uppercase tracking-wider opacity-60">Cancha</th>
                        <th className="p-3 text-[10px] font-black uppercase tracking-wider opacity-60">Horario</th>
                        <th className="p-3 text-[10px] font-black uppercase tracking-wider opacity-60 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {validationResults.map((result, idx) => (
                        <tr key={idx} className={`transition-colors ${result.status === 'conflict' ? 'bg-amber-500/5' : 'hover:bg-muted/30'}`}>
                          <td className="p-3">
                            <p className="text-xs font-bold">{result.dateStr}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-[11px] font-medium text-muted-foreground">{result.courtName}</p>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <p className="text-[11px] font-black">
                                {new Date(result.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {result.status === 'conflict' && result.alternatives.length > 0 && (
                                <Select onValueChange={(val) => {
                                  const alt = result.alternatives.find((a: any) => a.label === val);
                                  if (alt) {
                                    updateValidationRow(idx, {
                                      startTime: alt.startTime,
                                      endTime: alt.endTime,
                                      courtId: alt.courtId,
                                      courtName: alt.courtName
                                    });
                                  }
                                }}>
                                  <SelectTrigger className="h-7 text-[10px] bg-amber-100 border-amber-200 text-amber-900 font-bold px-2 py-0">
                                    <SelectValue placeholder="Ver alternativas" />
                                  </SelectTrigger>
                                  <SelectContent alignItemWithTrigger={false} side="bottom">
                                    {result.alternatives.map((alt: any, aIdx: number) => (
                                      <SelectItem key={aIdx} value={alt.label} className="text-[11px]">
                                        {alt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {result.status === 'ok' ? (
                              <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-500/10">
                                <LucideCheck className="h-3.5 w-3.5" />
                              </div>
                            ) : (
                              <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-4 ring-amber-500/10 animate-pulse">
                                <LucideAlertTriangle className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed">
                  TIP: Si hay conflictos, selecciona uno de los horarios sugeridos por el motor o cancela y ajusta la reserva.
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
