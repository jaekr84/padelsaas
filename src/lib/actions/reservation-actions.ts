"use server";

import { db } from "@/db";
import { bookings, courts, members, centers } from "@/db/schema";
import { and, eq, or, lt, gt, between, gte, lte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/auth";

export async function createReservationAction(data: {
  courtId: string;
  guestName: string;
  price: number;
  startTime: string | Date;
  endTime: string | Date;
  centerId: string; // Not stored in bookings, but useful for revalidation or context if needed
}) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  if (start >= end) {
    throw new Error("El horario de inicio debe ser anterior al horario de fin");
  }

  let finalCourtId = data.courtId;

  // --- REGLA GLOBAL: Resolución estricta de canchas "auto" y bloqueo de superposición ---
  if (finalCourtId === "auto") {
    const centerCourts = await db.query.courts.findMany({
      where: eq(courts.centerId, data.centerId),
      orderBy: (courts, { asc }) => [asc(courts.name)],
    });

    const freeCourts = [];
    for (const c of centerCourts) {
      const overlap = await db.query.bookings.findFirst({
        where: (bookings, { and, eq, lt, gt }) => and(
          eq(bookings.courtId, c.id),
          lt(bookings.startTime, end),
          gt(bookings.endTime, start)
        ),
      });
      if (!overlap) {
        // Count total bookings for this court on this day to find "most available"
        const dayStart = new Date(start);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(start);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await db.query.bookings.findMany({
          where: and(
            eq(bookings.courtId, c.id),
            lt(bookings.startTime, dayEnd),
            gt(bookings.endTime, dayStart)
          )
        });
        freeCourts.push({ id: c.id, count: count.length });
      }
    }

    if (freeCourts.length > 0) {
      // Pick court with minimum bookings
      freeCourts.sort((a, b) => a.count - b.count);
      finalCourtId = freeCourts[0].id;
    } else {
      throw new Error("Regla Global: Capacidad agotada. No hay canchas disponibles para este módulo.");
    }
  }

  // Check for overlapping bookings
  const overlapping = await db.query.bookings.findFirst({
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
  await db.insert(bookings).values({
    courtId: finalCourtId,
    guestName: data.guestName,
    price: data.price,
    startTime: start,
    endTime: end,
    status: "confirmed", // Default internal creation to confirmed
  });

  revalidatePath("/courts");
  
  return { success: true };
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
  
  let finalCenterId: string | undefined = reservations[0]?.centerId;
  if (!finalCenterId) {
    const cookieStore = await cookies();
    finalCenterId = cookieStore.get("active_center_id")?.value;
  }

  if (!finalCenterId) {
    return { success: false, error: "No se pudo determinar la sucursal activa." };
  }

  const centerCourts = await db.query.courts.findMany({
    where: eq(courts.centerId, finalCenterId),
    orderBy: (courts, { asc }) => [asc(courts.name)],
  });

  // --- REGLA GLOBAL: Validación estricta previa a la inserción ---
  // Mantenemos un registro en memoria de las reservas que vamos a insertar para validar solapamientos internos
  const pendingInserts: { courtId: string; startTime: Date; endTime: Date; guestName: string; price: number; }[] = [];
  const failures = [];

  for (const rawReq of reservations) {
    const req = {
      ...rawReq,
      startTime: new Date(rawReq.startTime),
      endTime: new Date(rawReq.endTime)
    };
    if (req.startTime.getTime() >= req.endTime.getTime()) continue;
    
    let finalCourtId = req.courtId;
    let conflict = false;

    // Check Auto or Fixed
    if (finalCourtId === "auto") {
      const freeCourts = [];
      for (const c of centerCourts) {
        // Chequeo contra DB
        const overlapDB = await db.query.bookings.findFirst({
          where: and(
            eq(bookings.courtId, c.id),
            lt(bookings.startTime, req.endTime),
            gt(bookings.endTime, req.startTime)
          ),
        });

        // Chequeo contra pendingInserts
        const overlapMemory = pendingInserts.some(p => 
          p.courtId === c.id && p.startTime.getTime() < req.endTime.getTime() && p.endTime.getTime() > req.startTime.getTime()
        );

        if (!overlapDB && !overlapMemory) {
          // Count total bookings for this day (DB + Memory)
          const dayStart = new Date(req.startTime);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(req.startTime);
          dayEnd.setHours(23, 59, 59, 999);

          const dbCount = await db.query.bookings.findMany({
            where: and(
              eq(bookings.courtId, c.id),
              lt(bookings.startTime, dayEnd),
              gt(bookings.endTime, dayStart)
            )
          });
          const memCount = pendingInserts.filter(p => 
            p.courtId === c.id && p.startTime.getTime() < dayEnd.getTime() && p.endTime.getTime() > dayStart.getTime()
          ).length;

          freeCourts.push({ id: c.id, count: dbCount.length + memCount });
        }
      }

      if (freeCourts.length > 0) {
        freeCourts.sort((a, b) => a.count - b.count);
        finalCourtId = freeCourts[0].id;
      } else {
        conflict = true;
      }
    } else {
      // Fixed court check against DB
      const overlapDB = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.courtId, finalCourtId),
          lt(bookings.startTime, req.endTime),
          gt(bookings.endTime, req.startTime)
        ),
      });

      // Fixed court check against pendingInserts
      const overlapMemory = pendingInserts.some(p => 
        p.courtId === finalCourtId && p.startTime.getTime() < req.endTime.getTime() && p.endTime.getTime() > req.startTime.getTime()
      );

      if (overlapDB || overlapMemory) conflict = true;
    }

    if (conflict) {
      const court = centerCourts.find(c => c.id === finalCourtId);
      failures.push({
         date: req.startTime,
         courtName: court?.name || "Desconocida",
         alternatives: ["Bloqueado por superposición de módulos."]
      });
      continue;
    }

    pendingInserts.push({
      courtId: finalCourtId,
      guestName: req.guestName,
      price: req.price,
      startTime: req.startTime,
      endTime: req.endTime,
    });
  }

  // REGLA GLOBAL: Si hay AL MENOS UN conflicto, bloqueamos toda la operación para evitar módulos sueltos
  if (failures.length > 0) {
    const details = failures.map(f => `${f.date.toLocaleDateString('es-AR')} (${f.courtName})`).join(", ");
    throw new Error(`Conflictos detectados en: ${details}. Está bloqueado superponer módulos. Revisa los horarios y vuelve a validar.`);
  }

  // Safe to insert all
  for (const insert of pendingInserts) {
    await db.insert(bookings).values({
      courtId: insert.courtId,
      guestName: insert.guestName,
      price: insert.price,
      startTime: insert.startTime,
      endTime: insert.endTime,
      status: "confirmed",
    });
  }

  revalidatePath("/courts");
  
  return { 
    success: true, 
    count: pendingInserts.length, 
    failures: [] 
  };
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

  // Pre-fetch all courts for the center
  const firstReqCenter = reservations[0]?.centerId;
  
  // Fallback to active center if ID is missing in request
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

  // Optimization: Fetch ALL bookings for this center's courts for the entire batch range
  // We add 1 day of padding to each side to handle timezone shifts safely.
  const allBatchStart = new Date(Math.min(...reservations.map(r => new Date(r.startTime).getTime())));
  allBatchStart.setDate(allBatchStart.getDate() - 1);
  const allBatchEnd = new Date(Math.max(...reservations.map(r => new Date(r.endTime).getTime())));
  allBatchEnd.setDate(allBatchEnd.getDate() + 1);

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
    if (req.startTime.getTime() >= req.endTime.getTime()) continue;
    
    // Filter bookings for this specific day from our pre-fetched list
    const dayStart = new Date(req.startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(req.startTime);
    dayEnd.setHours(23, 59, 59, 999);

    const dayBookings = allCenterBookings.filter(b => 
      b.startTime.getTime() < dayEnd.getTime() && b.endTime.getTime() > dayStart.getTime()
    );

    // Calculate daily usage per court for load-balancing logic
    const TOTAL_HOURS = 18;
    const courtUsage = centerCourts.map(c => {
      const bookedMs = dayBookings
        .filter(b => b.courtId === c.id)
        .reduce((acc, b) => acc + (b.endTime.getTime() - b.startTime.getTime()), 0);
      const bookedHours = bookedMs / (1000 * 60 * 60);
      return {
        id: c.id,
        usagePct: Math.round((bookedHours / TOTAL_HOURS) * 100)
      };
    });

    // CASE 1: Single Reservation (Explode options into individual rows)
    if (reservations.length === 1) {
      const anyOk = false;
      let alreadySelected = false; // To ensure only one is pre-selected
      
      for (const c of centerCourts) {
        const hasOverlapDB = dayBookings.some(b => 
          b.courtId === c.id && (req.startTime.getTime() < b.endTime.getTime() && req.endTime.getTime() > b.startTime.getTime())
        );

        const hasOverlapMemory = pendingValidations.some(p => 
          p.courtId === c.id && (req.startTime.getTime() < p.endTime.getTime() && req.endTime.getTime() > p.startTime.getTime())
        );

        const hasOverlap = hasOverlapDB || hasOverlapMemory;

        const usage = courtUsage.find(u => u.id === c.id)?.usagePct || 0;
        const freePct = 100 - usage;
        
        // Logic for pre-selection:
        // 1. If it's the SPECIFIC court requested and it's free.
        // 2. If it's 'auto' mode and this is the FIRST free court we've found in this specific search.
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
          alternatives: [] 
        });
      }

      // Sort: Pre-selected first, then free ones by usage (wear-leveling), then busy ones.
      finalResults.sort((a, b) => {
        if (a.selected !== b.selected) return a.selected ? -1 : 1;
        if (a.status !== b.status) return a.status === 'ok' ? -1 : 1;
        return a.usagePct - b.usagePct; 
      });

      continue; // Skip the default one-row logic for this single-item batch
    }

    // CASE 2: Multi-date or Recurring (Traditional one-row-per-date logic)
    let finalCourtId = req.courtId;
    let conflict = false;
    let assignedCourtName = "Auto";

    if (finalCourtId === "auto") {
      const freeCourts = [];
      for (const c of centerCourts) {
        const overlapDB = dayBookings.some(b => 
          b.courtId === c.id && (req.startTime.getTime() < b.endTime.getTime() && req.endTime.getTime() > b.startTime.getTime())
        );
        const overlapMemory = pendingValidations.some(p => 
          p.courtId === c.id && (req.startTime.getTime() < p.endTime.getTime() && req.endTime.getTime() > p.startTime.getTime())
        );

        if (!overlapDB && !overlapMemory) {
          // Count usage for this court on this day
          const usage = dayBookings.filter(b => b.courtId === c.id).length +
                        pendingValidations.filter(p => p.courtId === c.id).length;
          freeCourts.push({ id: c.id, name: c.name, usage });
        }
      }

      if (freeCourts.length > 0) {
        freeCourts.sort((a, b) => a.usage - b.usage);
        finalCourtId = freeCourts[0].id;
        assignedCourtName = freeCourts[0].name;
      } else {
        conflict = true;
      }
    } else {
      const selected = centerCourts.find(c => c.id === finalCourtId);
      assignedCourtName = selected?.name || "Desconocida";
      const overlapDB = dayBookings.some(b => 
          b.courtId === finalCourtId && (req.startTime.getTime() < b.endTime.getTime() && req.endTime.getTime() > b.startTime.getTime())
      );
      const overlapMemory = pendingValidations.some(p => 
          p.courtId === finalCourtId && (req.startTime.getTime() < p.endTime.getTime() && req.endTime.getTime() > p.startTime.getTime())
      );

      if (overlapDB || overlapMemory) conflict = true;
    }

    if (!conflict) {
      pendingValidations.push({
        courtId: finalCourtId,
        startTime: req.startTime,
        endTime: req.endTime
      });
    }

    let alternatives: { startTime: Date, endTime: Date, courtId: string, courtName: string, label: string, usagePct: number }[] = [];
    const durationMs = req.endTime.getTime() - req.startTime.getTime();
    const requestedMs = req.startTime.getTime();
    const offsets = [0, -30, 30, -60, 60, -90, 90, -120, 120, -180, 180];

    for (const offset of offsets) {
      const candStart = new Date(requestedMs + offset * 60000);
      const candEnd = new Date(candStart.getTime() + durationMs);
      
      if (candStart.getHours() < 7 || (candEnd.getHours() === 0 && candEnd.getMinutes() > 0) || candEnd.getHours() > 1) continue;

      for (const c of centerCourts) {
         if (offset === 0 && c.id === finalCourtId) continue;

         const hasOverlapDB = dayBookings.some(b => 
            b.courtId === c.id && (candStart.getTime() < b.endTime.getTime() && candEnd.getTime() > b.startTime.getTime())
         );
         const hasOverlapMemory = pendingValidations.some(p => 
            p.courtId === c.id && (candStart.getTime() < p.endTime.getTime() && candEnd.getTime() > p.startTime.getTime())
         );
         
         const hasOverlap = hasOverlapDB || hasOverlapMemory;

         if (!hasOverlap) {
            const usage = courtUsage.find(u => u.id === c.id)?.usagePct || 0;
            const freePct = 100 - usage;
            const diffLabel = offset === 0 ? "(Mismo horario)" : (offset > 0 ? `(+${offset}m)` : `(${offset}m)`);
            
            alternatives.push({
              startTime: candStart,
              endTime: candEnd,
              courtId: c.id,
              courtName: c.name,
              usagePct: usage,
              label: `${candStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${c.name} [Libre: ${freePct}%] ${diffLabel}`
            });
         }
      }
    }

    alternatives.sort((a, b) => {
      const aDist = Math.abs(a.startTime.getTime() - requestedMs);
      const bDist = Math.abs(b.startTime.getTime() - requestedMs);
      if (aDist === bDist) return a.usagePct - b.usagePct;
      return aDist - bDist;
    });

    finalResults.push({
      dateStr: req.startTime.toLocaleDateString('es-AR'),
      originalStartTime: req.startTime,
      startTime: req.startTime,
      endTime: req.endTime,
      courtId: finalCourtId,
      courtName: assignedCourtName,
      status: conflict ? ('conflict' as const) : ('ok' as const),
      selected: true, 
      usagePct: courtUsage.find(u => u.id === finalCourtId)?.usagePct || 0,
      alternatives
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

  // Parse date boundaries
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

  // Get all bookings for the center's courts on that day
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
