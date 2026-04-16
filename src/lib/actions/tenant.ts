"use server";

import { db } from "@/db";
import { tenants } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTenantAction() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, session.user.tenantId),
  });

  return tenant;
}

export async function updateTenantAction(data: { id: string; name: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { id, name } = data;

  if (!id) throw new Error("Tenant ID is required");

  await db
    .update(tenants)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, id));

  revalidatePath("/settings");
  revalidatePath("/home");
  return { success: true };
}
