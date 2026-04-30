"use server";

import { db } from "@/db";
import { centers, courts, bookings, customers, tenants } from "@/db/schema";
import { eq, and, or, gte, lte, desc, lt, gt, ilike, sql } from "drizzle-orm";
import { auth } from "@/auth";

export async function getPublicCentersAction(filters?: { sport?: string; query?: string; city?: string; state?: string }) {
  try {
    let tenantMatchIds: string[] = [];
    
    // Si hay una búsqueda por texto, buscamos IDs de clubes que coincidan
    if (filters?.query) {
      const matchingTenants = await db.select({ id: tenants.id })
        .from(tenants)
        .where(ilike(tenants.name, `%${filters.query}%`));
      tenantMatchIds = matchingTenants.map(t => t.id);
    }

    const conditions = [];

    // Lógica de búsqueda principal (Nombre de Sede O Nombre de Club)
    if (filters?.query) {
      const queryOr = [ilike(centers.name, `%${filters.query}%`)];
      if (tenantMatchIds.length > 0) {
        queryOr.push(sql`${centers.tenantId} IN (${sql.join(tenantMatchIds.map(id => sql`${id}`), sql`, `)})`);
      }
      conditions.push(or(...queryOr));
    }

    if (filters?.city && filters.city !== "all") {
      conditions.push(ilike(centers.city, filters.city));
    }

    if (filters?.state && filters.state !== "all") {
      conditions.push(ilike(centers.state, filters.state));
    }

    const result = await db.query.centers.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        tenant: true,
        courts: filters?.sport ? {
          where: eq(courts.type, filters.sport)
        } : true,
      }
    });

    // Filtrar por deporte si es necesario
    let finalFiltered = result;
    if (filters?.sport) {
      finalFiltered = result.filter(c => c.courts.length > 0);
    }

    return { success: true, data: finalFiltered };
  } catch (error) {
    console.error("Error fetching public centers:", error);
    return { success: false, error: "No se pudieron obtener los centros" };
  }
}

export async function getCenterDetailsAction(centerId: string) {
  try {
    const center = await db.query.centers.findFirst({
      where: eq(centers.id, centerId),
      with: {
        courts: {
          with: {
            bookings: true,
          }
        },
        tenant: true,
      }
    });
    return { success: true, data: center };
  } catch (error) {
    console.error("Error fetching center details:", error);
    return { success: false, error: "No se pudo obtener el detalle del centro" };
  }
}

export async function createPublicBookingAction(data: {
  courtId: string;
  startTime: Date;
  endTime: Date;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // 1. Validar que la cancha existe
    const court = await db.query.courts.findFirst({
      where: eq(courts.id, data.courtId),
      with: {
        center: true,
      }
    });
    if (!court) return { success: false, error: "La cancha no existe" };

    // 2. Validar disponibilidad (Overlap check)
    console.log("Checking overlap for court:", data.courtId);
    console.log("Start:", data.startTime.toISOString());
    console.log("End:", data.endTime.toISOString());

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const existing = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.courtId, data.courtId),
        and(
          lt(bookings.startTime, data.endTime),
          gt(bookings.endTime, data.startTime)
        ),
        or(
          eq(bookings.status, "confirmed"),
          and(
            eq(bookings.status, "pending"),
            gt(bookings.createdAt, fifteenMinutesAgo)
          )
        )
      ),
      orderBy: [desc(bookings.startTime)],
    });

    if (existing) {
      return { success: false, error: "El horario ya está ocupado o en proceso de pago" };
    }

    // 4. Calcular precio
    const durationMinutes = Math.ceil((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60));
    const slots = Math.ceil(durationMinutes / 30);
    const totalPrice = slots * (court.center?.defaultPrice30 || 0);

    // 5. Crear la reserva
    if (userId && court.center?.tenantId) {
       let customerRecord = await db.query.customers.findFirst({
         where: and(
           eq(customers.userId, userId),
           eq(customers.tenantId, court.center.tenantId)
         )
       });

       if (!customerRecord) {
         // Crear ficha de cliente automática
         const [newCustomer] = await db.insert(customers).values({
           tenantId: court.center.tenantId,
           userId: userId,
           firstName: data.guestName.split(' ')[0] || "Usuario",
           lastName: data.guestName.split(' ').slice(1).join(' ') || "Registrado",
           phone: data.guestPhone,
           email: data.guestEmail,
         }).returning();
         customerRecord = newCustomer;
       }
       
       const [newBooking] = await db.insert(bookings).values({
         courtId: data.courtId,
         userId: userId,
         customerId: customerRecord.id,
         startTime: data.startTime,
         endTime: data.endTime,
         price: totalPrice,
         status: "pending",
         paymentStatus: "pending",
       }).returning();
       
       return { success: true, bookingId: newBooking.id };
    } else {
      // Guest booking
      const [newBooking] = await db.insert(bookings).values({
        courtId: data.courtId,
        guestName: data.guestName,
        startTime: data.startTime,
        endTime: data.endTime,
        price: totalPrice,
        status: "pending",
        paymentStatus: "pending",
      }).returning();

      return { success: true, bookingId: newBooking.id };
    }
  } catch (error) {
    console.error("Error creating public booking:", error);
    return { success: false, error: "Ocurrió un error al procesar la reserva" };
  }
}

export async function getPlayerBookingsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const result = await db.query.bookings.findMany({
      where: eq(bookings.userId, session.user.id),
      with: {
        court: {
          with: {
            center: true,
          }
        }
      },
      orderBy: [desc(bookings.startTime)],
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching player bookings:", error);
    return { success: false, error: "No se pudieron obtener las reservas" };
  }
}
export async function getPlayerLastContactAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    // Buscar en la última reserva del usuario
    const lastBooking = await db.query.bookings.findFirst({
      where: eq(bookings.userId, session.user.id),
      orderBy: [desc(bookings.createdAt)],
    });

    if (lastBooking) {
      // Intentar obtener el teléfono de la ficha de cliente
      if (lastBooking.customerId) {
        const customer = await db.query.customers.findFirst({
          where: eq(customers.id, lastBooking.customerId),
        });
        if (customer?.phone) {
          return { success: true, data: { phone: customer.phone, name: `${customer.firstName} ${customer.lastName}` } };
        }
      }
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Error fetching player contact:", error);
    return { success: false, error: "No se pudo obtener el contacto" };
  }
}

export async function getExploreMetaDataAction() {
  try {
    const allCenters = await db.select({ city: centers.city, state: centers.state }).from(centers);
    const allSports = await db.select({ type: courts.type }).from(courts);

    const uniqueCities = Array.from(new Set(allCenters.map(c => c.city?.trim().toUpperCase()).filter(Boolean))).sort() as string[];
    const uniqueStates = Array.from(new Set(allCenters.map(c => c.state?.trim().toUpperCase()).filter(Boolean))).sort() as string[];
    const uniqueSports = Array.from(new Set(allSports.map(s => s.type?.trim().toUpperCase()).filter(Boolean))).sort() as string[];

    // Mapa para filtrar ciudades por provincia en el cliente
    const cityToStateMap: Record<string, string> = {};
    allCenters.forEach(c => {
      if (c.city && c.state) {
        cityToStateMap[c.city.trim().toUpperCase()] = c.state.trim().toUpperCase();
      }
    });

    return {
      success: true,
      data: {
        cities: uniqueCities,
        states: uniqueStates,
        sports: uniqueSports,
        cityToStateMap
      }
    };
  } catch (error) {
    console.error("Error fetching explore metadata:", error);
    return { success: false, error: "Error al cargar filtros" };
  }
}
