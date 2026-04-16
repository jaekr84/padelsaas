"use server";

import { db } from "@/db";
import { courts, members, centers } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCourtsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Get the tenant for the user
  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found for user");

  // Get the center for this user (assigned center or first one)
  const center = await db.query.centers.findFirst({
    where: session.user.centerId 
      ? eq(centers.id, session.user.centerId)
      : eq(centers.tenantId, userMember.tenantId),
    orderBy: (centers, { asc }) => [asc(centers.createdAt)],
  });

  if (!center) return [];

  // Get today's boundaries
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Get all courts for that center with today's bookings
  const allCourts = await db.query.courts.findMany({
    where: eq(courts.centerId, center.id),
    with: {
      bookings: {
        where: (bookings, { and, gte, lte }) => and(
          gte(bookings.startTime, startOfDay),
          lte(bookings.startTime, endOfDay)
        ),
      },
    },
    orderBy: (courts, { asc }) => [asc(courts.name)],
  });

  return allCourts;
}

export async function addCourtAction(data: {
  name: string;
  type: string;
  surface: string;
  isPanoramic: boolean;
  hasLighting: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  const center = await db.query.centers.findFirst({
    where: session.user.centerId 
      ? eq(centers.id, session.user.centerId)
      : eq(centers.tenantId, userMember.tenantId),
    orderBy: (centers, { asc }) => [asc(centers.createdAt)],
  });

  if (!center) throw new Error("No center found. Please configure your center first.");

  // Enforce capacity
  const currentCourts = await db.query.courts.findMany({
    where: eq(courts.centerId, center.id),
  });

  if (currentCourts.length >= center.courtsCount) {
    throw new Error(`Capacidad máxima alcanzada (${center.courtsCount} canchas)`);
  }

  await db.insert(courts).values({
    ...data,
    centerId: center.id,
  });

  revalidatePath("/courts");
  return { success: true };
}

export async function updateCourtAction(id: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(courts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(courts.id, id));

  revalidatePath("/courts");
  return { success: true };
}

export async function deleteCourtAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(courts).where(eq(courts.id, id));

  revalidatePath("/courts");
  return { success: true };
}
