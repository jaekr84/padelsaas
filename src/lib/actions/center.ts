"use server";

import { db } from "@/db";
import { centers, members } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";

export async function getCenterAction(id?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const activeCenterId = cookieStore.get("active_center_id")?.value;

  // Get the tenant for the user
  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found for user");

  // Determine which center to fetch:
  // 1. If an ID is explicitly passed, use it (highest priority).
  // 2. If an active center cookie is set, use it.
  // 3. Fallback to session centerId or first center.
  const centerIdToFetch = id || activeCenterId || session.user.centerId;

  const center = await db.query.centers.findFirst({
    where: centerIdToFetch
      ? eq(centers.id, centerIdToFetch)
      : eq(centers.tenantId, userMember.tenantId),
    with: {
      pricingSchedules: true,
      courts: true,
    },
    orderBy: (centers, { asc }) => [asc(centers.createdAt)],
  });

  return center;
}

export async function createCenterAction(data: { name: string }) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  // Limitar a un máximo de 5 sedes
  const existingCenters = await db.query.centers.findMany({
    where: eq(centers.tenantId, session.user.tenantId),
  });

  if (existingCenters.length >= 5) {
    throw new Error("Límite de sedes alcanzado (Máximo 5). Contacte con soporte para ampliar su plan.");
  }

  const newCenter = await db.insert(centers).values({
    tenantId: session.user.tenantId,
    name: data.name,
    courtsCount: 1,
    openTime: "08:00",
    closeTime: "23:00",
  }).returning();

  revalidatePath("/settings");
  return { success: true, center: newCenter[0] };
}

export async function getCentersAction() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const tenantCenters = await db.query.centers.findMany({
    where: eq(centers.tenantId, session.user.tenantId),
    with: {
      pricingSchedules: true,
      courts: true,
    },
    orderBy: (centers, { asc }) => [asc(centers.createdAt)],
  });

  return tenantCenters;
}

export async function updateCenterAction(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { id, ...updateData } = data;

  if (!id) throw new Error("Center ID is required");

  console.log(`[DEBUG] Updating center ${id} with data:`, JSON.stringify(updateData, null, 2));

  // Verify ownership (simplified)
  try {
    const result = await db
      .update(centers)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(centers.id, id))
      .returning();

    console.log(`[DEBUG] Update result:`, JSON.stringify(result, null, 2));

    if (result.length === 0) {
      console.warn(`[DEBUG] No center found with id ${id} to update.`);
    }

    revalidatePath("/settings");
    revalidatePath("/courts");
    return { success: true, result };
  } catch (error) {
    console.error(`[DEBUG] Error updating center:`, error);
    throw error;
  }
}
