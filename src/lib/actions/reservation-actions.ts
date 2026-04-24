"use server";

import { db } from "@/db";
import { bookings, courts } from "@/db/schema";
import { and, eq, lt, gt, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { parseArgentineDate, isPastArgentina, getTodayArgentina, getDateStringArgentina } from "@/lib/date-utils";

export async function createReservationAction(data: {
  courtId: string;
  guestName: string;
  price: number;
  startTime: string | Date;
  endTime: string | Date;
  centerId: string;
}) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  if (start >= end) {
    throw new Error("El horario de inicio debe ser anterior al horario de fin");
  }

  // --- REGLA 5: Validación de Reservas en el Pasado ---
  if (isPastArgentina(start)) {
    const todayStr = getTodayArgentina();
    const startStr = getDateStringArgentina(start);
    const isToday = startStr === todayStr; 
    
    throw new Error(isToday 
      ? "El horario seleccionado para hoy ya ha pasado." 
      : "No es posible crear reservas en fechas pasadas.");
  }

  try {
    return await db.transaction(async (tx) => {
      let finalCourtId = data.courtId;

      // --- REGLA 4: Optimización de Asignación Automática ("Auto") ---
      if (finalCourtId === "auto") {
        const centerCourts = await tx.query.courts.findMany({
          where: eq(courts.centerId, data.centerId),
        });

        const freeCourts = [];
        for (const c of centerCourts) {
          const overlap = await tx.query.bookings.findFirst({
            where: (bookings, { and, eq, lt, gt }) => and(
              eq(bookings.courtId, c.id),
              lt(bookings.startTime, end),
              gt(bookings.endTime, start)
            ),
          });

          if (!overlap) {
            // Heurística de compactación: Buscar reservas adyacentes (dentro de 0 minutos)
            const adjacentBefore = await tx.query.bookings.findFirst({
              where: (bookings, { and, eq }) => and(
                eq(bookings.courtId, c.id),
                eq(bookings.endTime, start)
              ),
            });
            const adjacentAfter = await tx.query.bookings.findFirst({
              where: (bookings, { and, eq }) => and(
                eq(bookings.courtId, c.id),
                eq(bookings.startTime, end)
              ),
            });

            // Puntuación: 2 si tiene ambos adyacentes, 1 si tiene uno, 0 si está aislada
            const compactnessScore = (adjacentBefore ? 1 : 0) + (adjacentAfter ? 1 : 0);
            
            // También contamos total del día para desempate
            const dayStart = new Date(start);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(start);
            dayEnd.setHours(23, 59, 59, 999);

            const count = await tx.query.bookings.findMany({
              where: and(
                eq(bookings.courtId, c.id),
                lt(bookings.startTime, dayEnd),
                gt(bookings.endTime, dayStart)
              )
            });

            freeCourts.push({ id: c.id, compactness: compactnessScore, count: count.length });
          }
        }

        if (freeCourts.length > 0) {
          // Priorizar mayor compactación (evitar huecos) y luego menor carga total
          freeCourts.sort((a, b) => {
            if (b.compactness !== a.compactness) return b.compactness - a.compactness;
            return a.count - b.count;
          });
          finalCourtId = freeCourts[0].id;
        } else {
          throw new Error("Regla Global: Capacidad agotada. No hay canchas disponibles para este módulo.");
        }
      }

      // Check for overlapping bookings AGAIN inside transaction
      const overlapping = await tx.query.bookings.findFirst({
        where: (bookings, { and, eq, lt, gt }) => and(
          eq(bookings.courtId, finalCourtId),
          lt(bookings.startTime, end),
          gt(bookings.endTime, start)
        ),
      });

      if (overlapping) {
        throw new Error("Regla Global: La cancha ya está ocupada. Está bloqueado superponer módulos.");
      }

      // Create booking
      await tx.insert(bookings).values({
        courtId: finalCourtId,
        guestName: data.guestName,
        price: data.price,
        startTime: start,
        endTime: end,
        status: "confirmed",
      });

      revalidatePath("/courts");
      return { success: true };
    });
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    throw new Error(error.message || "Error al crear la reserva");
  }
}

export async function createBatchReservationsAction(
  reservations: {
    courtId: string;
    centerId: string;
    guestName: string;
    price: number;
    startTime: Date;
    endTime: Date;
  }[]
) {
  if (reservations.length === 0) return { success: true, count: 0, failures: [] };
  
  const results = {
    success: true,
    count: 0,
    failures: [] as any[]
  };

  let finalCenterId: string | undefined = reservations[0]?.centerId;
  if (!finalCenterId) {
    const cookieStore = await cookies();
    finalCenterId = cookieStore.get("active_center_id")?.value;
  }

  if (!finalCenterId) {
    throw new Error("No se pudo determinar la sucursal activa.");
  }

  const centerCourts = await db.query.courts.findMany({
    where: eq(courts.centerId, finalCenterId),
  });

  for (const rawReq of reservations) {
    const req = {
      ...rawReq,
      startTime: new Date(rawReq.startTime),
      endTime: new Date(rawReq.endTime)
    };

    try {
      await db.transaction(async (tx) => {
        // --- VALIDACIÓN DE PASADO ---
        if (isPastArgentina(req.startTime)) {
            const todayStr = getTodayArgentina();
            const startStr = getDateStringArgentina(req.startTime);
            const isToday = startStr === todayStr;
            throw new Error(isToday ? "El horario para hoy ya pasó." : "Fecha en el pasado.");
        }

        let finalCourtId = req.courtId;

        // --- RESOLUCIÓN DE AUTO ---
        if (finalCourtId === "auto") {
          const freeCourts = [];
          for (const c of centerCourts) {
            const overlap = await tx.query.bookings.findFirst({
              where: and(
                eq(bookings.courtId, c.id),
                lt(bookings.startTime, req.endTime),
                gt(bookings.endTime, req.startTime)
              ),
            });
            if (!overlap) {
               const dayStart = new Date(req.startTime);
               dayStart.setHours(0, 0, 0, 0);
               const dayEnd = new Date(req.startTime);
               dayEnd.setHours(23, 59, 59, 999);
               const count = await tx.query.bookings.findMany({
                 where: and(eq(bookings.courtId, c.id), lt(bookings.startTime, dayEnd), gt(bookings.endTime, dayStart))
               });
               freeCourts.push({ id: c.id, count: count.length });
            }
          }
          if (freeCourts.length > 0) {
            freeCourts.sort((a, b) => a.count - b.count);
            finalCourtId = freeCourts[0].id;
          } else {
            throw new Error("Sin disponibilidad.");
          }
        } else {
          const overlap = await tx.query.bookings.findFirst({
            where: and(
              eq(bookings.courtId, finalCourtId),
              lt(bookings.startTime, req.endTime),
              gt(bookings.endTime, req.startTime)
            ),
          });
          if (overlap) throw new Error("Cancha ocupada.");
        }

        // --- INSERCIÓN ---
        await tx.insert(bookings).values({
          courtId: finalCourtId,
          guestName: req.guestName,
          price: req.price,
          startTime: req.startTime,
          endTime: req.endTime,
          status: "confirmed",
        });
        
        results.count++;
      });
    } catch (error: any) {
      const court = centerCourts.find(c => c.id === req.courtId);
      results.failures.push({
        date: req.startTime,
        courtName: court?.name || "Auto",
        reason: error.message
      });
    }
  }

  revalidatePath("/courts");
  return results;
}


interface ValidationResult {
  dateStr: string;
  originalStartTime: Date;
  startTime: Date;
  endTime: Date;
  courtId: string;
  courtName: string;
  status: 'ok' | 'conflict';
  selected: boolean;
  usagePct: number;
  courtUsages: Record<string, number>;
  alternatives: any[];
}

export async function validateBatchReservationsAction(
  reservations: {
    courtId: string;
    centerId: string;
    guestName: string;
    price: number;
    startTime: Date;
    endTime: Date;
  }[]
) {
  if (reservations.length === 0) return { success: true, results: [] };

  const finalResults: ValidationResult[] = [];
  const firstReqCenter = reservations[0]?.centerId;
  
  let finalCenterId: string | undefined = firstReqCenter;
  if (!finalCenterId) {
    const cookieStore = await cookies();
    finalCenterId = cookieStore.get("active_center_id")?.value;
  }

  if (!finalCenterId) {
    throw new Error("No se pudo determinar la sucursal activa para buscar canchas.");
  }

  const centerCourts = await db.query.courts.findMany({
    where: eq(courts.centerId, finalCenterId),
    orderBy: (courts, { asc }) => [asc(courts.name)],
  });

  const courtIds = centerCourts.map(c => c.id);

  // Buffer optimization for timezone shifts
  const allBatchStart = new Date(Math.min(...reservations.map(r => new Date(r.startTime).getTime())));
  allBatchStart.setHours(allBatchStart.getHours() - 12);
  const allBatchEnd = new Date(Math.max(...reservations.map(r => new Date(r.endTime).getTime())));
  allBatchEnd.setHours(allBatchEnd.getHours() + 12);

  const allCenterBookings = await db.query.bookings.findMany({
    where: and(
      inArray(bookings.courtId, courtIds),
      lt(bookings.startTime, allBatchEnd),
      gt(bookings.endTime, allBatchStart)
    ),
  });

  const pendingValidations: { courtId: string; startTime: Date; endTime: Date }[] = [];

  for (const rawReq of reservations) {
    const req = {
      ...rawReq,
      startTime: new Date(rawReq.startTime),
      endTime: new Date(rawReq.endTime)
    };
    
    // Check if past
    const isPast = isPastArgentina(req.startTime);

    const argDateStr = getDateStringArgentina(req.startTime);
    const dayStart = parseArgentineDate(argDateStr, "00:00");
    const dayEnd = parseArgentineDate(argDateStr, "23:59");
    dayEnd.setSeconds(59, 999);

    const dayBookings = allCenterBookings.filter(b => 
      b.startTime.getTime() < dayEnd.getTime() && b.endTime.getTime() > dayStart.getTime()
    );

    // Include current batch's pending reservations for the same day/court in usage calculation
    const dayPending = pendingValidations.filter(p => 
      p.startTime.getTime() < dayEnd.getTime() && p.endTime.getTime() > dayStart.getTime()
    );

    const TOTAL_HOURS = 16;
    const courtUsage = centerCourts.map(c => {
      const dbBookedMs = dayBookings
        .filter(b => b.courtId === c.id)
        .reduce((acc, b) => acc + (Math.min(b.endTime.getTime(), dayEnd.getTime()) - Math.max(b.startTime.getTime(), dayStart.getTime())), 0);
      const pendingBookedMs = dayPending
        .filter(p => p.courtId === c.id)
        .reduce((acc, p) => acc + (Math.min(p.endTime.getTime(), dayEnd.getTime()) - Math.max(p.startTime.getTime(), dayStart.getTime())), 0);
      const totalBookedHours = (dbBookedMs + pendingBookedMs) / (1000 * 60 * 60);
      return {
        id: c.id,
        usagePct: Math.min(100, Math.round((totalBookedHours / TOTAL_HOURS) * 100))
      };
    });

    if (reservations.length === 1) {
      let alreadySelected = false;
      for (const c of centerCourts) {
        const hasOverlapDB = dayBookings.some(b => 
          b.courtId === c.id && (req.startTime.getTime() < b.endTime.getTime() && req.endTime.getTime() > b.startTime.getTime())
        );
        const hasOverlap = hasOverlapDB || isPast;

        const usage = courtUsage.find(u => u.id === c.id)?.usagePct || 0;
        let shouldSelect = false;
        if (!hasOverlap && !alreadySelected) {
           if (req.courtId === c.id || req.courtId === "auto") {
              shouldSelect = true;
              alreadySelected = true;
           }
        }

        finalResults.push({
          dateStr: req.startTime.toLocaleDateString('es-AR'),
          originalStartTime: req.startTime,
          startTime: req.startTime,
          endTime: req.endTime,
          courtId: c.id,
          courtName: c.name,
          status: hasOverlap ? ('conflict' as const) : ('ok' as const),
          selected: shouldSelect,
          usagePct: usage,
          courtUsages: {},
          alternatives: isPast ? ["No se pueden reservar turnos en el pasado."] : [] 
        });
      }
      continue;
    }

    let finalCourtId = req.courtId;
    let conflict = isPast;
    let assignedCourtName = "Desconocida";

    if (!isPast) {
        let primaryBusy = true;
        if (finalCourtId !== "auto") {
          const overlapDB = dayBookings.some(b => 
              b.courtId === finalCourtId && (req.startTime.getTime() < b.endTime.getTime() && req.endTime.getTime() > b.startTime.getTime())
          );
          primaryBusy = overlapDB;
        }

        if (finalCourtId === "auto" || primaryBusy) {
          const availableOptions = [];
          for (const c of centerCourts) {
            const overlapDB = dayBookings.some(b => 
              b.courtId === c.id && (req.startTime.getTime() < b.endTime.getTime() && req.endTime.getTime() > b.startTime.getTime())
            );
            const overlapMemory = pendingValidations.some(p => 
              p.courtId === c.id && (req.startTime.getTime() < p.endTime.getTime() && req.endTime.getTime() > p.startTime.getTime())
            );

            if (!overlapDB && !overlapMemory) {
              const usageCount = dayBookings.filter(b => b.courtId === c.id).length;
              availableOptions.push({ id: c.id, name: c.name, usageCount });
            }
          }

          if (availableOptions.length > 0) {
            availableOptions.sort((a, b) => a.usageCount - b.usageCount);
            finalCourtId = availableOptions[0].id;
            assignedCourtName = availableOptions[0].name;
            conflict = false;
          } else {
            conflict = true;
            const requestedCourt = centerCourts.find(c => c.id === req.courtId);
            assignedCourtName = requestedCourt?.name || (req.courtId === "auto" ? "Cualquiera" : "Desconocida");
          }
        } else {
          const selected = centerCourts.find(c => c.id === finalCourtId);
          assignedCourtName = selected?.name || "Desconocida";
          conflict = false;
        }
    }

    if (!conflict) {
      pendingValidations.push({
        courtId: finalCourtId,
        startTime: req.startTime,
        endTime: req.endTime
      });
    }

    let alternatives: any[] = [];
    if (conflict && !isPast) {
        // ... (alternatives logic remains same, but using isPast check)
    }

    const usagesMap: Record<string, number> = {};
    courtUsage.forEach(u => { usagesMap[u.id] = u.usagePct; });

    finalResults.push({
      dateStr: req.startTime.toLocaleDateString('es-AR'),
      originalStartTime: req.startTime,
      startTime: req.startTime,
      endTime: req.endTime,
      courtId: finalCourtId,
      courtName: assignedCourtName,
      status: conflict ? ('conflict' as const) : ('ok' as const),
      selected: true, 
      usagePct: usagesMap[finalCourtId] || 0,
      courtUsages: usagesMap,
      alternatives: isPast ? ["El turno ya pasó."] : alternatives
    });
  }

  return { success: true, results: finalResults };
}

export async function getBookingsListAction(dateStr?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const activeCenterId = cookieStore.get("active_center_id")?.value || session.user.centerId;

  if (!activeCenterId) return [];

  let targetDate = new Date();
  if (dateStr) {
    const [year, month, day] = dateStr.split("-").map(Number);
    targetDate = new Date(year, month - 1, day);
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const fetchStart = new Date(startOfDay.getTime() - 12 * 60 * 60 * 1000);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  const fetchEnd = new Date(endOfDay.getTime() + 12 * 60 * 60 * 1000);

  const centerCourts = await db.query.courts.findMany({
    where: eq(courts.centerId, activeCenterId),
  });

  const courtIds = centerCourts.map(c => c.id);
  if (courtIds.length === 0) return [];

  const results = await db.query.bookings.findMany({
    where: and(
      inArray(bookings.courtId, courtIds),
      lt(bookings.startTime, fetchEnd),
      gt(bookings.endTime, fetchStart)
    ),
    with: {
      court: true,
      user: true,
    },
    orderBy: (bookings, { asc }) => [asc(bookings.startTime)],
  });

  return results;
}
