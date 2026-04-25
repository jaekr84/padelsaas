"use server";

import { db } from "@/db";
import { users, tenants, members, centers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export async function registerAction(data: {
  name: string;
  email: string;
  password: string;
  isBusiness: boolean;
  businessName?: string;
}) {
  try {
    // 1. Validar si el usuario ya existe
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return { success: false, error: "El correo electrónico ya está registrado" };
    }

    // 2. Hash de contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Crear usuario
    const [newUser] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    }).returning();

    // 4. Si es negocio, crear Tenant y Membresía
    if (data.isBusiness && data.businessName) {
      // a. Crear el Tenant (La Empresa/Club)
      const [newTenant] = await db.insert(tenants).values({
        name: data.businessName,
        slug: data.businessName.toLowerCase().replace(/\s+/g, "-") + "-" + nanoid(4),
      }).returning();

      // b. Crear la Sede inicial (Center)
      const [newCenter] = await db.insert(centers).values({
        tenantId: newTenant.id,
        name: data.businessName + " - Sede Central",
        city: "Por definir",
        state: "Por definir",
      }).returning();

      // c. Crear el Miembro (Dueño)
      await db.insert(members).values({
        userId: newUser.id,
        tenantId: newTenant.id,
        centerId: newCenter.id,
        role: "owner",
      });
    }

    return { success: true, data: newUser };
  } catch (error) {
    console.error("Error en registro:", error);
    return { success: false, error: "Ocurrió un error al procesar el registro" };
  }
}

export async function getLandingPageAction() {
  const { auth } = await import("@/auth");
  const session = await auth();
  
  if (!session) return "/landing";

  // Si tiene un tenantId o centerId en la sesión (via JWT callback), es staff/owner
  if (session.user?.tenantId || session.user?.role === "admin" || session.user?.role === "owner") {
    return "/home";
  }

  // De lo contrario, es un jugador
  return "/profile";
}
