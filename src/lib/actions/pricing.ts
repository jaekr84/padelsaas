"use server";

import { db } from "@/db";
import { pricingSchedules, centers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getPricingSchedulesAction(centerId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const results = await db.query.pricingSchedules.findMany({
    where: eq(pricingSchedules.centerId, centerId),
    orderBy: [pricingSchedules.startTime],
  });

  return results;
}

export async function updatePricingConfigAction(
  centerId: string, 
  data: { 
    defaultPrice30: number; 
    schedules: Array<{
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
      priority: number;
      price: number;
    }> 
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 1. Update Center's default price
  await db.update(centers)
    .set({ 
      defaultPrice30: data.defaultPrice30,
      updatedAt: new Date()
    })
    .where(eq(centers.id, centerId));

  // 2. Clear existing schedules for this center
  await db.delete(pricingSchedules)
    .where(eq(pricingSchedules.centerId, centerId));

  // 3. Insert new schedules
  if (data.schedules.length > 0) {
    await db.insert(pricingSchedules).values(
      data.schedules.map(s => ({
        ...s,
        centerId,
        updatedAt: new Date(),
      }))
    );
  }

  revalidatePath("/settings");
  return { success: true };
}
