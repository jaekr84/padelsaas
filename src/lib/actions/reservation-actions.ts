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

  // Check for overlapping bookings
  const overlapping = await db.query.bookings.findFirst({
    where: (bookings, { and, eq, or, lt, gt }) => and(
      eq(bookings.courtId, data.courtId),
      // To overlap: existing start < new end AND existing end > new start
      and(
        lt(bookings.startTime, end),
        gt(bookings.endTime, start)
      )
    ),
  });

  if (overlapping) {
    throw new Error("La cancha ya está ocupada en ese horario");
  }

  // Create booking
  await db.insert(bookings).values({
    courtId: data.courtId,
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
  
  // We don't use a strict db.transaction error throw because we want Best-Effort execution.
  // Instead, we loop and insert, tracking failures, so we can return them gracefully.
  const results = {
    count: 0,
    failures: [] as { date: Date, alternatives: string[] }[]
  };
  // 1. Pre-fetch all courts for "auto" capability if needed
  const firstReqCenter = reservations[0]?.centerId;
  const centerCourts = await db.query.courts.findMany({
    where: eq(courts.centerId, firstReqCenter),
    orderBy: (courts, { asc }) => [asc(courts.name)],
  });

  for (const req of reservations) {
      if (req.startTime >= req.endTime) continue;
      
      let finalCourtId = req.courtId;
      let conflict = false;

      // Check Auto or Fixed
      if (finalCourtId === "auto") {
        let foundFreeId = null;
        for (const c of centerCourts) {
          const overlap = await db.query.bookings.findFirst({
            where: and(
              eq(bookings.courtId, c.id),
              and(lt(bookings.startTime, req.endTime), gt(bookings.endTime, req.startTime))
            ),
          });
          if (!overlap) {
            foundFreeId = c.id;
            break;
          }
        }

        if (foundFreeId) {
          finalCourtId = foundFreeId;
        } else {
          conflict = true;
        }
      } else {
        // Fixed court check
        const overlap = await db.query.bookings.findFirst({
          where: and(
            eq(bookings.courtId, finalCourtId),
            and(lt(bookings.startTime, req.endTime), gt(bookings.endTime, req.startTime))
          ),
        });
        if (overlap) conflict = true;
      }

      if (conflict) {
        // --- SMART ALTERNATIVE SUGGESTION ENGINE ---
        // Get all boundaries for that day to find exactly where it fits 
        const dayStart = new Date(req.startTime);
        dayStart.setHours(8, 0, 0, 0); // Open theoretically
        const dayEnd = new Date(req.startTime);
        dayEnd.setHours(23, 0, 0, 0); // Close theoretically
        
        const dayBookings = await db.query.bookings.findMany({
          where: and(
            between(bookings.startTime, dayStart, dayEnd) // roughly all day
          ),
        });

        // Search closest slots +/- 3 hours
        const durationMs = req.endTime.getTime() - req.startTime.getTime();
        const alternatives: string[] = [];
        
        // Very basic matrix lookup: loop every 30 mins around the requested time
        const requestedMs = req.startTime.getTime();
        const offsets = [-90, 90, -60, 60, -30, 30, -120, 120, -150, 150]; // Minutes offsets
        
        for (const offset of offsets) {
          if (alternatives.length >= 2) break;
          
          const candStart = new Date(requestedMs + offset * 60000);
          const candEnd = new Date(candStart.getTime() + durationMs);
          
          // Must stay within reasonable operating hour limits
          if (candStart.getHours() < 7 || candEnd.getHours() > 23) continue;

          for (const c of centerCourts) {
             const overlapping = dayBookings.some(b => 
                b.courtId === c.id && 
                ((candStart < b.endTime) && (candEnd > b.startTime))
             );
             if (!overlapping) {
                const diffLabel = offset > 0 ? `(+${offset/60} hrs)` : `(${offset/60} hrs)`;
                const timeStr = candStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                alternatives.push(`${timeStr} en ${c.name} ${diffLabel}`);
                break; // Found one for this offset, try next offset
             }
          }
        }

        results.failures.push({
           date: req.startTime,
           alternatives: alternatives.length > 0 ? alternatives : ["Jornada completamente bloqueada."]
        });
        
        continue; // Skip inserting this booking completely
      }

      // Safe to insert
      await db.insert(bookings).values({
        courtId: finalCourtId,
        guestName: req.guestName,
        price: req.price,
        startTime: req.startTime,
        endTime: req.endTime,
        status: "confirmed",
      });

      results.count++;
    }

  revalidatePath("/courts");
  
  return { 
    success: true, 
    count: results.count, 
    failures: results.failures.map(f => ({
      dateStr: f.date.toLocaleDateString(),
      alternatives: f.alternatives
    })) 
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
  const centerCourts = await db.query.courts.findMany({
    where: eq(courts.centerId, firstReqCenter),
    orderBy: (courts, { asc }) => [asc(courts.name)],
  });

  for (const req of reservations) {
    if (req.startTime >= req.endTime) continue;
    
    // Always search for alternatives (even if no conflict) to allow preference changes/load distribution
    const dayStart = new Date(req.startTime);
    dayStart.setHours(7, 0, 0, 0); 
    const dayEnd = new Date(req.startTime);
    dayEnd.setHours(23, 59, 59, 999); 
    
    const dayBookings = await db.query.bookings.findMany({
      where: and(between(bookings.startTime, dayStart, dayEnd)),
    });

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
        const hasOverlap = dayBookings.some(b => 
          b.courtId === c.id && ((req.startTime < b.endTime) && (req.endTime > b.startTime))
        );

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
      let foundFreeId = null;
      let foundName = "";
      for (const c of centerCourts) {
        const overlap = dayBookings.some(b => 
          b.courtId === c.id && ((req.startTime < b.endTime) && (req.endTime > b.startTime))
        );
        if (!overlap) {
          foundFreeId = c.id;
          foundName = c.name;
          break;
        }
      }
      if (foundFreeId) {
        finalCourtId = foundFreeId;
        assignedCourtName = foundName;
      } else {
        conflict = true;
      }
    } else {
      const selected = centerCourts.find(c => c.id === finalCourtId);
      assignedCourtName = selected?.name || "Desconocida";
      const overlap = dayBookings.some(b => 
          b.courtId === finalCourtId && ((req.startTime < b.endTime) && (req.endTime > b.startTime))
      );
      if (overlap) conflict = true;
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

         const hasOverlap = dayBookings.some(b => 
            b.courtId === c.id && ((candStart < b.endTime) && (candEnd > b.startTime))
         );
         
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
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all bookings for the center's courts on that day
  const centerCourts = await db.query.courts.findMany({
    where: eq(courts.centerId, activeCenterId),
  });

  const courtIds = centerCourts.map(c => c.id);
  if (courtIds.length === 0) return [];

  const results = await db.query.bookings.findMany({
    where: and(
      inArray(bookings.courtId, courtIds),
      gte(bookings.startTime, startOfDay),
      lte(bookings.startTime, endOfDay)
    ),
    with: {
      court: true,
      user: true,
    },
    orderBy: (bookings, { asc }) => [asc(bookings.startTime)],
  });

  return results;
}
