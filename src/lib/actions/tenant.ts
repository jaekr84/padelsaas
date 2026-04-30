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

export async function updateTenantAction(data: { id: string; name: string; purchaseFlow?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { id, name, purchaseFlow } = data;

  if (!id) throw new Error("Tenant ID is required");

  await db
    .update(tenants)
    .set({
      name,
      purchaseFlow: purchaseFlow as any,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, id));

  revalidatePath("/settings");
  revalidatePath("/home");
  return { success: true };
}

export async function updateMercadoPagoSettingsAction(data: { id: string; mpAccessToken: string; mpPublicKey: string; mpWebhookUrl?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { id, mpAccessToken, mpPublicKey, mpWebhookUrl } = data;

  if (!id) throw new Error("Tenant ID is required");

  await db
    .update(tenants)
    .set({
      mpAccessToken,
      mpPublicKey,
      mpWebhookUrl,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, id));

  revalidatePath("/settings");
  return { success: true };
}
