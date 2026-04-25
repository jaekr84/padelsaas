"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getCustomersAction() {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "No autorizado" };

    // En un entorno multi-tenant real filtraríamos por tenantId
    // Por ahora traemos todos los del sistema para simplificar el MVP
    const result = await db.query.customers.findMany({
      orderBy: [desc(customers.createdAt)],
      with: {
        bookings: true,
        sales: true,
      }
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return { success: false, error: "No se pudieron obtener los clientes" };
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
    if (!session) return { success: false, error: "No autorizado" };

    // Validar duplicados
    if (data.dni) {
      const existing = await db.query.customers.findFirst({ where: eq(customers.dni, data.dni) });
      if (existing) return { success: false, error: "Ya existe un cliente con este DNI" };
    }
    if (data.phone) {
      const existing = await db.query.customers.findFirst({ where: eq(customers.phone, data.phone) });
      if (existing) return { success: false, error: "Ya existe un cliente con este teléfono" };
    }

    const tenant = await db.query.tenants.findFirst();
    if (!tenant) return { success: false, error: "No se encontró un tenant activo" };

    await db.insert(customers).values({
      tenantId: tenant.id,
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
    if (!session) return { success: false, error: "No autorizado" };

    // Validar duplicados en registro rápido
    if (data.phone) {
      const existing = await db.query.customers.findFirst({ where: eq(customers.phone, data.phone) });
      if (existing) return { success: false, error: "Este teléfono ya está registrado con otro cliente" };
    }

    const tenant = await db.query.tenants.findFirst();
    if (!tenant) return { success: false, error: "No se encontró un tenant activo" };

    const [newCustomer] = await db.insert(customers).values({
      tenantId: tenant.id,
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
