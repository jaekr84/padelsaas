"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(data: { name: string; phone?: string; dni?: string; padelLevel?: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  try {
    if (!data.name || data.name.trim() === "") {
        return { success: false, error: "El nombre no puede estar vacío" };
    }

    await db.update(users)
      .set({ 
        name: data.name,
        phone: data.phone || null,
        dni: data.dni || null,
        padelLevel: data.padelLevel || null
      })
      .where(eq(users.id, session.user.id));
      
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Ocurrió un error al actualizar el perfil" };
  }
}

export async function getProfileAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }
  
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        name: true,
        email: true,
        phone: true,
        dni: true,
        padelLevel: true,
      }
    });
    
    if (!user) return { success: false, error: "Usuario no encontrado" };
    
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: "Error al obtener perfil" };
  }
}

import bcrypt from "bcryptjs";

export async function changePasswordAction(data: { currentPassword: string; newPassword: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || !user.password) {
      return { success: false, error: "Usuario no encontrado o sin contraseña configurada" };
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      return { success: false, error: "La contraseña actual es incorrecta" };
    }

    if (data.newPassword.length < 6) {
      return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" };
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Ocurrió un error al cambiar la contraseña" };
  }
}
