"use server";

import { db } from "@/db";
import { terminals, paymentMethods } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// --- TERMINALES ---

export async function getTerminalsAction() {
  try {
    const result = await db.query.terminals.findMany({
      orderBy: [desc(terminals.createdAt)],
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "No se pudieron obtener las terminales" };
  }
}

export async function createTerminalAction(name: string) {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "No autorizado" };

    const tenant = await db.query.tenants.findFirst();
    if (!tenant) return { success: false, error: "No se encontró un tenant activo" };

    await db.insert(terminals).values({
      tenantId: tenant.id,
      name,
    });

    revalidatePath("/(main)/configuracion");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo crear la terminal" };
  }
}

export async function toggleTerminalStatusAction(id: string, isActive: boolean) {
  try {
    await db.update(terminals).set({ isActive }).where(eq(terminals.id, id));
    revalidatePath("/(main)/configuracion");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo actualizar el estado" };
  }
}

export async function updateTerminalNameAction(id: string, name: string) {
  try {
    await db.update(terminals).set({ name }).where(eq(terminals.id, id));
    revalidatePath("/(main)/configuracion");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo actualizar el nombre" };
  }
}

// --- MEDIOS DE PAGO ---

export async function getPaymentMethodsAction() {
  try {
    const result = await db.query.paymentMethods.findMany({
      orderBy: [desc(paymentMethods.createdAt)],
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "No se pudieron obtener los medios de pago" };
  }
}

export async function createPaymentMethodAction(data: { name: string, type: string }) {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "No autorizado" };

    const tenant = await db.query.tenants.findFirst();
    if (!tenant) return { success: false, error: "No se encontró un tenant activo" };

    await db.insert(paymentMethods).values({
      tenantId: tenant.id,
      name: data.name,
      type: data.type,
    });

    revalidatePath("/(main)/configuracion");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo crear el medio de pago" };
  }
}

export async function togglePaymentMethodStatusAction(id: string, isActive: boolean) {
  try {
    await db.update(paymentMethods).set({ isActive }).where(eq(paymentMethods.id, id));
    revalidatePath("/(main)/configuracion");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo actualizar el estado" };
  }
}

export async function updatePaymentMethodNameAction(id: string, name: string) {
  try {
    await db.update(paymentMethods).set({ name }).where(eq(paymentMethods.id, id));
    revalidatePath("/(main)/configuracion");
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo actualizar el nombre" };
  }
}
