import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createReservationAction, createBatchReservationsAction, validateBatchReservationsAction } from "@/lib/actions/reservation-actions";
import { capitalize } from "@/lib/formatters";

export const reservationFormSchema = z.object({
  reservationType: z.enum(["single", "recurring", "block"]).default("single"),
  guestName: z.string().optional(),
  courtId: z.string().default("auto"),
  dateStr: z.string().min(1, "Selecciona una fecha"),
  startTimeStr: z.string().min(1, "Horario inválido"),
  durationMins: z.coerce.number().min(30).max(1440),
  price: z.coerce.number().min(0).default(0),
  recurringEndDateStr: z.string().optional(),
  recurringDays: z.array(z.number()).optional(),
}).refine(data => {
  if (data.reservationType !== "block" && (!data.guestName || data.guestName.trim().length < 2)) {
    return false;
  }
  return true;
}, {
  message: "El nombre debe tener al menos 2 caracteres",
  path: ["guestName"],
}).refine(data => {
  if (data.reservationType === "recurring") {
    if (!data.recurringEndDateStr) return false;
    if (!data.recurringDays || data.recurringDays.length === 0) return false;
  }
  return true;
}, {
  message: "Debes seleccionar una fecha final y al menos un día de la semana",
  path: ["recurringEndDateStr"],
});

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export function useReservationForm({
  onSuccess,
  centerId,
  center,
  date = new Date(),
}: {
  onSuccess: () => void;
  centerId: string;
  center?: any;
  date?: Date;
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema) as any,
    defaultValues: {
      reservationType: "single",
      guestName: "",
      courtId: "auto",
      dateStr: date.toISOString().split("T")[0],
      startTimeStr: "",
      durationMins: 90,
      price: 0,
      recurringEndDateStr: "",
      recurringDays: [date.getDay()],
    },
  });

  // --- Auto-Pricing Logic (Option A) ---
  const watchStartTime = form.watch("startTimeStr");
  const watchDuration = form.watch("durationMins");
  const watchDate = form.watch("dateStr");
  const [appliedRateInfo, setAppliedRateInfo] = useState<{ name: string; price: number } | null>(null);

  useEffect(() => {
    if (!center) return;
    
    // Sort by priority DESC so highest priority matches first
    const schedules = [...(center.pricingSchedules || [])].sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
    const defaultPrice = center.defaultPrice30 || 0;
    
    const [yyyy, mm, dd] = watchDate.split("-").map(Number);
    const dayOfWeek = new Date(yyyy, mm - 1, dd).getDay();

    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const startMinutes = timeToMinutes(watchStartTime);

    // Find band for Option A: Price determined by START time
    const matchingBand = schedules.find((s: any) => {
      const isDayMatch = s.daysOfWeek.includes(dayOfWeek);
      const bandStart = timeToMinutes(s.startTime);
      const bandEnd = timeToMinutes(s.endTime);
      return isDayMatch && startMinutes >= bandStart && startMinutes < bandEnd;
    });

    const pricePer30 = matchingBand ? matchingBand.price : defaultPrice;
    const modules = Math.round(watchDuration / 30);
    const finalPrice = pricePer30 * modules;

    form.setValue("price", finalPrice, { shouldValidate: true, shouldDirty: true });
    setAppliedRateInfo({
      name: matchingBand ? `Franja Especial (${matchingBand.startTime} - ${matchingBand.endTime})` : "Tarifa Base",
      price: pricePer30
    });
  }, [watchStartTime, watchDuration, watchDate, center, form]);

  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any[] | null>(null);

  const onSimulateBatch = async () => {
    const values = form.getValues();
    setIsValidating(true);
    try {
      const [hours, minutes] = values.startTimeStr.split(":").map(Number);
      const [yyyy, mm, dd] = values.dateStr.split("-").map(Number);
      const startDateTime = new Date(yyyy, mm - 1, dd, hours, minutes, 0, 0);

      const batchDates = [];

      if (values.reservationType === "single") {
        const rowStart = new Date(startDateTime);
        const rowEnd = new Date(startDateTime);
        rowEnd.setMinutes(rowStart.getMinutes() + values.durationMins);
        batchDates.push({
          courtId: values.courtId,
          centerId: centerId,
          guestName: values.guestName || "Cliente",
          price: values.price,
          startTime: rowStart,
          endTime: rowEnd,
        });
      } else {
        if (!values.recurringEndDateStr || !values.recurringDays || values.recurringDays.length === 0) {
          toast.error("Faltan datos de recurrencia para simular");
          setIsValidating(false);
          return;
        }
        
        const endRecurrence = new Date(values.recurringEndDateStr + "T23:59:59");
        let cursorDate = new Date(startDateTime);

        while (cursorDate <= endRecurrence) {
          if (values.recurringDays.includes(cursorDate.getDay())) {
            const rowStart = new Date(cursorDate);
            const rowEnd = new Date(cursorDate);
            rowEnd.setMinutes(rowStart.getMinutes() + values.durationMins);
            batchDates.push({
              courtId: values.courtId,
              centerId: centerId,
              guestName: values.guestName || "Cliente",
              price: values.price,
              startTime: rowStart,
              endTime: rowEnd,
            });
          }
          cursorDate.setDate(cursorDate.getDate() + 1);
        }
      }

      const response = await validateBatchReservationsAction(batchDates);
      if (response && response.success) {
        setValidationResults(response.results);
        toast.info("Simulación completada. Revisa la tabla central.");
      }
    } catch (error: any) {
      toast.error("Error en la simulación", { description: error.message });
    } finally {
      setIsValidating(false);
    }
  };

  const updateValidationRow = (index: number, newData: any) => {
    if (!validationResults) return;
    const next = [...validationResults];
    next[index] = { ...next[index], ...newData, status: 'ok', selected: true };
    setValidationResults(next);

    // If it's a single reservation, sync with the main form
    if (form.getValues("reservationType") === "single") {
      if (newData.courtId) form.setValue("courtId", newData.courtId);
      if (newData.startTime) {
        const timeStr = new Date(newData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        form.setValue("startTimeStr", timeStr);
      }
    }
  };

  const toggleResultSelection = (index: number) => {
    if (!validationResults) return;
    const next = [...validationResults];
    const isSingle = form.getValues("reservationType") === "single";

    if (isSingle) {
      const currentlySelected = next[index].selected;
      next.forEach((r, i) => {
        r.selected = (i === index) ? !currentlySelected : false;
      });
      
      // Sync with main form if selected
      if (!currentlySelected) {
        form.setValue("courtId", next[index].courtId);
        const timeStr = new Date(next[index].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        form.setValue("startTimeStr", timeStr);
      }
    } else {
      next[index] = { ...next[index], selected: !next[index].selected };
    }
    setValidationResults(next);
  };

  const onSubmit = async (values: ReservationFormValues) => {
    setLoading(true);
    try {
      const [hours, minutes] = values.startTimeStr.split(":").map(Number);
      const [yyyy, mm, dd] = values.dateStr.split("-").map(Number);
      
      const startDateTime = new Date(yyyy, mm - 1, dd, hours, minutes, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(startDateTime.getMinutes() + values.durationMins);

      const formattedName = values.reservationType === "block" 
        ? "Bloqueo Técnico" 
        : capitalize(values.guestName || "Cliente");

      if (values.reservationType === "recurring") {
        // Only book SELECTED rows
        const finalBatch = validationResults ? validationResults
          .filter(r => r.selected)
          .map(r => ({
            courtId: r.courtId,
            centerId: centerId,
            guestName: formattedName,
            price: values.price,
            startTime: new Date(r.startTime),
            endTime: new Date(r.endTime),
          })) : [];

        if (finalBatch.length === 0) {
           toast.error(validationResults ? "No hay ninguna fecha seleccionada para reservar" : "Primero debes simular y validar las fechas");
           setLoading(false);
           return;
        }

        const response = await createBatchReservationsAction(finalBatch);
        
        if (response.success) {
          toast.success(`Éxito: ${response.count} reservas fijadas.`);
          setValidationResults(null);
          form.reset();
          onSuccess();
        }
        
      } else {
        let finalCourtId = values.courtId;
        let finalStart = startDateTime;
        let finalEnd = endDateTime;

        // If user simulated and chose a specific court from the exploded options
        if (values.reservationType === "single" && validationResults && validationResults.length > 0) {
          const r = validationResults.find(res => res.selected);
          if (!r) {
            toast.error("La reserva está desmarcada. Selecciona una opción para confirmar.");
            setLoading(false);
            return;
          }
          finalCourtId = r.courtId;
          finalStart = new Date(r.startTime);
          finalEnd = new Date(r.endTime);
        }

        const response = await createReservationAction({
          courtId: finalCourtId,
          guestName: formattedName,
          price: values.price,
          startTime: finalStart,
          endTime: finalEnd,
          centerId: centerId,
        });

        if (response.success) {
          toast.success(values.reservationType === "block" ? "Cancha bloqueada exitosamente" : `Reserva creada con éxito para ${formattedName}`, {
            description: `Total a cobrar: $ ${values.price}`,
          });
          form.reset();
          onSuccess();
        }
      }
    } catch (error: any) {
      toast.error("Error al crear reserva", {
        description: error.message || "Ocurrió un problema inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    loading,
    isValidating,
    validationResults,
    onSimulateBatch,
    updateValidationRow,
    toggleResultSelection,
    appliedRateInfo,
    clearValidation: () => setValidationResults(null),
  };
}
