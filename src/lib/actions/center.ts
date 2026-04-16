"use server";

import { db } from "@/db";
import { centers, members } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCenterAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Get the tenant for the user
  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found for user");

  // Determine which center to fetch:
  // 1. If user has a specifically assigned center in their membership, get that one.
  // 2. Otherwise (e.g. for owners/admins without assignment), get the first center for the tenant.
  const center = await db.query.centers.findFirst({
    where: session.user.centerId 
      ? eq(centers.id, session.user.centerId)
      : eq(centers.tenantId, userMember.tenantId),
    orderBy: (centers, { asc }) => [asc(centers.createdAt)],
  });

  return center;
}

export async function getCentersAction() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const tenantCenters = await db.query.centers.findMany({
    where: eq(centers.tenantId, session.user.tenantId),
    orderBy: (centers, { asc }) => [asc(centers.name)],
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

    // --- Automated Court Sync ---
    const updatedCenter = result[0];
    if (updatedCenter) {
      const existingCourts = await db.query.courts.findMany({
        where: (courts, { eq }) => eq(courts.centerId, updatedCenter.id),
      });

      const currentCount = existingCourts.length;
      const targetCount = updatedCenter.courtsCount;

      if (targetCount > currentCount) {
        const diff = targetCount - currentCount;
        const newCourtsData = Array.from({ length: diff }).map((_, i) => ({
          centerId: updatedCenter.id,
          name: `Cancha ${currentCount + i + 1}`,
          type: "indoor",
          surface: "Césped Sintético",
        }));

        await db.insert(require("@/db/schema").courts).values(newCourtsData);
      } else if (targetCount < currentCount) {
        // Find courts to delete (those with higher index names)
        const courtsToDelete = existingCourts
          .sort((a, b) => b.name.localeCompare(a.name)) // Sort descending to get highest first
          .slice(0, currentCount - targetCount);
        
        if (courtsToDelete.length > 0) {
          const { inArray } = require("drizzle-orm");
          const { courts } = require("@/db/schema");
          await db.delete(courts).where(inArray(courts.id, courtsToDelete.map(c => c.id)));
        }
      }
    }
    // ----------------------------

    revalidatePath("/courts");
    return { success: true, result };
  } catch (error) {
    console.error(`[DEBUG] Error updating center:`, error);
    throw error;
  }
}
