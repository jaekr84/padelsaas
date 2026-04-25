"use server";

import { db } from "@/db";
import { centers, courts, bookings, customers } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { auth } from "@/auth";

export async function getPublicCentersAction() {
  try {
    const result = await db.query.centers.findMany({
      with: {
        courts: true,
      }
    });
    return { success: true, data: result };
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
    const existing = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.courtId, data.courtId),
        gte(bookings.endTime, data.startTime),
        lte(bookings.startTime, data.endTime),
        eq(bookings.status, "confirmed")
      ),
    });

    if (existing) return { success: false, error: "El horario ya está ocupado" };

    // 3. Si el usuario está logueado, intentamos vincularlo o crear su ficha de customer en este tenant
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
       
       await db.insert(bookings).values({
         courtId: data.courtId,
         userId: userId,
         customerId: customerRecord.id,
         startTime: data.startTime,
         endTime: data.endTime,
         status: "confirmed",
         paymentStatus: "pending",
       });
    } else {
      // Guest booking
      await db.insert(bookings).values({
        courtId: data.courtId,
        guestName: data.guestName,
        startTime: data.startTime,
        endTime: data.endTime,
        status: "confirmed",
        paymentStatus: "pending",
      });
    }

    return { success: true };
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
