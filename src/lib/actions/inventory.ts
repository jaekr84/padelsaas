"use server";

import { db } from "@/db";
import { productStock, inventoryTransactions, members, centers } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updateStockAction(data: {
  productId: string;
  type: "purchase" | "sale" | "adjustment" | "transfer";
  quantity: number;
  reason?: string;
  centerId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const targetCenterId = data.centerId || cookieStore.get("active_center_id")?.value || session.user.centerId;

  if (!targetCenterId) throw new Error("No center selected");

  // Start a transaction to ensure data integrity
  return await db.transaction(async (tx) => {
    // 1. Check if stock record exists for this product and center
    const existingStock = await tx.query.productStock.findFirst({
      where: and(
        eq(productStock.productId, data.productId),
        eq(productStock.centerId, targetCenterId)
      ),
    });

    if (existingStock) {
      // Update existing stock
      await tx
        .update(productStock)
        .set({
          stock: existingStock.stock + data.quantity,
          updatedAt: new Date(),
        })
        .where(eq(productStock.id, existingStock.id));
    } else {
      // Create new stock record
      await tx.insert(productStock).values({
        productId: data.productId,
        centerId: targetCenterId,
        stock: data.quantity,
      });
    }

    // 2. Register transaction history
    await tx.insert(inventoryTransactions).values({
      productId: data.productId,
      centerId: targetCenterId,
      userId: session.user.id,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
    });

    revalidatePath("/inventory");
    return { success: true };
  });
}

export async function getInventoryHistoryAction(productId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const targetCenterId = cookieStore.get("active_center_id")?.value || session.user.centerId;

  if (!targetCenterId) throw new Error("No center selected");

  const whereClause = productId 
    ? and(eq(inventoryTransactions.centerId, targetCenterId), eq(inventoryTransactions.productId, productId))
    : eq(inventoryTransactions.centerId, targetCenterId);

  return await db.query.inventoryTransactions.findMany({
    where: whereClause,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    with: {
      product: true,
    }
  });
}
