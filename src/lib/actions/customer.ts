"use server";

import { db } from "@/db";
import { customers, users, tenants } from "@/db/schema";
import { eq, desc, and, or, sql, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { bookings, sales as salesTable, courts } from "@/db/schema";

export async function getCustomersAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const tenantId = session.user.tenantId;
    if (!tenantId) return { success: false, error: "No se encontró organización asociada" };

    const cookieStore = await cookies();
    const activeCenterId = cookieStore.get("active_center_id")?.value || session.user.centerId;

    const result = await db.query.customers.findMany({
      where: eq(customers.tenantId, tenantId),
      orderBy: [desc(customers.createdAt)],
      with: {
        bookings: activeCenterId ? {
          where: (bookings, { sql }) => sql`${bookings.courtId} IN (SELECT id FROM court WHERE center_id = ${activeCenterId})`
        } : true,
        sales: activeCenterId ? {
          where: (sales, { eq }) => eq(sales.centerId, activeCenterId)
        } : true,
      }
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return { success: false, error: "No se pudieron obtener los clientes" };
  }
}

/**
 * Busca usuarios en la plataforma global por DNI o Teléfono exacto.
 * Solo devuelve información básica para permitir la vinculación.
 */
export async function searchGlobalUserAction(query: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    if (!query || query.length < 3) return { success: true, data: [] };

    // Buscamos coincidencias exactas por DNI o Teléfono para evitar "scraping" masivo
    const foundUsers = await db.query.users.findMany({
      where: or(
        eq(users.dni, query),
        eq(users.phone, query),
        ilike(users.email, `%${query}%`)
      ),
      limit: 5
    });

    return { success: true, data: foundUsers };
  } catch (error) {
    console.error("Error en búsqueda global:", error);
    return { success: false, error: "Error al buscar en la plataforma" };
  }
}

/**
 * Vincula un usuario global a la base de clientes local del club.
 */
export async function linkGlobalUserToTenantAction(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) return { success: false, error: "No autorizado" };

    const tenantId = session.user.tenantId;

    // 1. Verificar si ya existe en este club
    const existing = await db.query.customers.findFirst({
      where: and(
        eq(customers.userId, userId),
        eq(customers.tenantId, tenantId)
      )
    });

    if (existing) return { success: true, data: existing, message: "Ya es cliente de este club" };

    // 2. Obtener datos globales
    const globalUser = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!globalUser) return { success: false, error: "Usuario no encontrado" };

    // 3. Crear ficha local
    const [newCustomer] = await db.insert(customers).values({
      tenantId: tenantId,
      userId: userId,
      firstName: globalUser.name?.split(' ')[0] || "Usuario",
      lastName: globalUser.name?.split(' ').slice(1).join(' ') || "Global",
      dni: globalUser.dni,
      phone: globalUser.phone,
      email: globalUser.email,
      category: "Frecuente",
    }).returning();

    revalidatePath("/customers");
    return { success: true, data: newCustomer };
  } catch (error) {
    console.error("Error al vincular usuario:", error);
    return { success: false, error: "No se pudo vincular el usuario" };
  }
}

export async function createCustomerAction(data: {
  firstName: string;
  lastName: string;
  dni?: string;
  phone?: string;
  email?: string;
  birthDate?: Date;
  category?: string;
  padelLevel?: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) return { success: false, error: "No autorizado" };

    const tenantId = session.user.tenantId;

    // Validar duplicados LOCALES
    if (data.dni) {
      const existing = await db.query.customers.findFirst({ 
        where: and(eq(customers.dni, data.dni), eq(customers.tenantId, tenantId)) 
      });
      if (existing) return { success: false, error: "Ya tenés un cliente registrado con este DNI" };
    }
    
    if (data.phone) {
      const existing = await db.query.customers.findFirst({ 
        where: and(eq(customers.phone, data.phone), eq(customers.tenantId, tenantId)) 
      });
      if (existing) return { success: false, error: "Ya tenés un cliente registrado con este teléfono" };
    }

    await db.insert(customers).values({
      tenantId: tenantId,
      firstName: data.firstName,
      lastName: data.lastName,
      dni: data.dni,
      phone: data.phone,
      email: data.email,
      birthDate: data.birthDate,
      category: data.category || "Frecuente",
      padelLevel: data.padelLevel,
      notes: data.notes,
    });

    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return { success: false, error: "No se pudo crear el cliente" };
  }
}

export async function createQuickCustomerAction(data: { firstName: string; phone?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) return { success: false, error: "No autorizado" };

    const tenantId = session.user.tenantId;

    if (data.phone) {
      const existing = await db.query.customers.findFirst({ 
        where: and(eq(customers.phone, data.phone), eq(customers.tenantId, tenantId)) 
      });
      if (existing) return { success: false, error: "Este teléfono ya está en tu lista de clientes" };
    }

    const [newCustomer] = await db.insert(customers).values({
      tenantId: tenantId,
      firstName: data.firstName,
      lastName: "",
      phone: data.phone,
      category: "Frecuente",
    }).returning();

    revalidatePath("/customers");
    return { success: true, data: newCustomer };
  } catch (error) {
    console.error("Error en registro rápido:", error);
    return { success: false, error: "No se pudo crear el cliente" };
  }
}
