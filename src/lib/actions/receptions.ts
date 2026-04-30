"use server";

import { db } from "@/db";
import { 
  purchases, 
  purchaseItems, 
  productStock, 
  inventoryTransactions, 
  receptions, 
  receptionItems,
  members,
  productBatches
} from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function getPendingReceptionsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const activeCenterId = cookieStore.get("active_center_id")?.value || session.user.centerId;

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  // Buscamos ítems de compra que estén pendientes o parciales para esta sede
  return await db.query.purchaseItems.findMany({
    where: and(
      eq(purchaseItems.centerId, activeCenterId || ""),
      sql`${purchaseItems.status} IN ('pending', 'partial')`
    ),
    with: {
      purchase: {
        with: {
          supplier: true
        }
      },
      product: true
    }
  });
}

export async function receiveItemsAction(data: {
  purchaseId: string;
  items: {
    purchaseItemId: string;
    productId: string;
    centerId: string;
    quantity: number;
    notes?: string;
  }[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  return await db.transaction(async (tx) => {
    // 1. Crear la cabecera de la recepción
    // Usamos el centerId del primer ítem (asumimos que la recepción es por sede)
    const centerId = data.items[0].centerId;

    const [newReception] = await tx.insert(receptions).values({
      purchaseId: data.purchaseId,
      centerId: centerId,
      receivedById: session.user.id,
      notes: data.items[0].notes || "Recepción de mercadería",
    }).returning();

    for (const item of data.items) {
      if (item.quantity <= 0) continue;

      // 2. Registrar el ítem recibido
      await tx.insert(receptionItems).values({
        receptionId: newReception.id,
        purchaseItemId: item.purchaseItemId,
        quantity: item.quantity,
      });

      // 3. Actualizar el ítem de la compra original
      const originalItem = await tx.query.purchaseItems.findFirst({
        where: eq(purchaseItems.id, item.purchaseItemId),
      });

      if (!originalItem) continue;

      const newReceivedQty = originalItem.receivedQuantity + item.quantity;
      const isCompleted = newReceivedQty >= originalItem.quantity;

      await tx.update(purchaseItems)
        .set({
          receivedQuantity: newReceivedQty,
          status: isCompleted ? "received" : "partial",
        })
        .where(eq(purchaseItems.id, item.purchaseItemId));

      // 4. IMPACTAR STOCK FINALMENTE
      const existingStock = await tx.query.productStock.findFirst({
        where: and(
          eq(productStock.productId, item.productId),
          eq(productStock.centerId, item.centerId)
        ),
      });

      const previousStock = existingStock?.stock || 0;
      const newStockValue = previousStock + item.quantity;

      if (existingStock) {
        await tx.update(productStock)
          .set({ stock: newStockValue, updatedAt: new Date() })
          .where(eq(productStock.id, existingStock.id));
      } else {
        await tx.insert(productStock).values({
          productId: item.productId,
          centerId: item.centerId,
          stock: newStockValue,
        });
      }

      // 5. Crear lote si tiene fecha de vencimiento (recuperamos de la compra)
      if (originalItem.expiryDate) {
        await tx.insert(productBatches).values({
          productId: item.productId,
          centerId: item.centerId,
          tenantId: userMember.tenantId,
          quantity: item.quantity,
          expiryDate: originalItem.expiryDate,
          batchNumber: originalItem.batchNumber,
        });
      }

      // 6. Registrar Transacción
      await tx.insert(inventoryTransactions).values({
        productId: item.productId,
        centerId: item.centerId,
        userId: session.user.id,
        type: "purchase",
        quantity: item.quantity,
        reason: `Recepción de Compra ${data.purchaseId}`,
      });
    }

    revalidatePath("/inventory");
    revalidatePath("/inventory/reception");
    return { success: true };
  });
}
