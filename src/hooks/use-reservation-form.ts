import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { createReservationAction, createBatchReservationsAction, validateBatchReservationsAction } from "@/lib/actions/reservation-actions";
import { capitalize } from "@/lib/formatters";

export const reservationFormSchema = z.object({
  reservationType: z.enum(["single", "recurring", "block"]).default("single"),
  guestName: z.string().optional(),
  courtId: z.string().min(1, "Selecciona una cancha"),
  dateStr: z.string().min(1, "Selecciona una fecha"),
  startTimeStr: z.string().min(1, "Horario inválido"),
  durationMins: z.coerce.number().min(30).max(180),
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
  date = new Date(),
}: {
  onSuccess: () => void;
  centerId: string;
  date?: Date;
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema) as any,
    defaultValues: {
      reservationType: "single",
      guestName: "",
      courtId: "",
      dateStr: date.toISOString().split("T")[0],
      startTimeStr: "18:00",
      durationMins: 90,
      price: 0,
      recurringEndDateStr: "",
      recurringDays: [date.getDay()],
    },
  });

  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any[] | null>(null);

  const onSimulateBatch = async () => {
    const values = form.getValues();
    if (!values.recurringEndDateStr || !values.recurringDays || values.recurringDays.length === 0) {
      toast.error("Faltan datos de recurrencia para simular");
      return;
    }

    setIsValidating(true);
    try {
      const [hours, minutes] = values.startTimeStr.split(":").map(Number);
      const [yyyy, mm, dd] = values.dateStr.split("-").map(Number);
      const startDateTime = new Date(yyyy, mm - 1, dd, hours, minutes, 0, 0);

      const endRecurrence = new Date(values.recurringEndDateStr + "T23:59:59");
      const batchDates = [];
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

      const response = await validateBatchReservationsAction(batchDates);
      if (response.success) {
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
    next[index] = { ...next[index], ...newData, status: 'ok' }; // Assume fixing it makes it 'ok' for now or the user knows
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
        // If we have validation results, we use THOSE instead of re-calculating (to respect manual fixes)
        const finalBatch = validationResults ? validationResults.map(r => ({
          courtId: r.courtId,
          centerId: centerId,
          guestName: formattedName,
          price: values.price,
          startTime: new Date(r.startTime),
          endTime: new Date(r.endTime),
        })) : [];

        if (finalBatch.length === 0) {
           toast.error("Primero debes simular y validar las fechas");
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
        const response = await createReservationAction({
          courtId: values.courtId,
          guestName: formattedName,
          price: values.price,
          startTime: startDateTime,
          endTime: endDateTime,
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
    clearValidation: () => setValidationResults(null),
  };
}
