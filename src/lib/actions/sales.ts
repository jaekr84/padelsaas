"use server";

import { db } from "@/db";
import { sales, saleItems, products, productBatches, productStock, inventoryTransactions, bookings } from "@/db/schema";
import { eq, sql, asc, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createSaleAction(data: {
  customerName: string;
  customerId?: string | null;
  paymentMethod: string;
  terminalId: string;
  centerId: string;
  subtotal: number;
  discount: number;
  charge: number;
  total: number;
  items: {
    productId?: string;
    bookingId?: string;
    categoryId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}) {
  const CANCHAS_CATEGORY_ID = "2346a106-97d9-4ca8-b6eb-ea880ad8df0b";
  try {
    const session = await auth();
    const userId = session?.user?.id;

    return await db.transaction(async (tx) => {
      // 1. Generar número de venta (Formato: V-YYYYMMDD-XXXX)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
      const countResult = await tx.select({ count: sql<number>`count(*)` }).from(sales);
      const saleNumber = `V-${dateStr}-${(countResult[0].count + 1).toString().padStart(4, "0")}`;

      // 2. Crear la venta
      const [newSale] = await tx.insert(sales).values({
        saleNumber,
        customerName: data.customerName || "Consumidor Final",
        customerId: data.customerId,
        paymentMethod: data.paymentMethod,
        terminalId: data.terminalId,
        centerId: data.centerId,
        subtotal: data.subtotal.toString(),
        discount: data.discount.toString(),
        charge: data.charge.toString(),
        total: data.total.toString(),
        userId: userId,
      }).returning();

      // 3. Procesar ítems
      for (const item of data.items) {
        // 3.1 Determinar categoría si no viene
        let categoryId = item.categoryId;
        if (item.bookingId) {
          categoryId = CANCHAS_CATEGORY_ID;
        } else if (item.productId && !categoryId) {
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId),
            columns: { categoryId: true }
          });
          categoryId = product?.categoryId || undefined;
        }

        // Registrar el ítem de venta
        await tx.insert(saleItems).values({
          saleId: newSale.id,
          productId: item.productId,
          bookingId: item.bookingId,
          categoryId: categoryId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
        });

        // 3.1 Si es una reserva, marcar como pagada
        if (item.bookingId) {
          await tx.update(bookings)
            .set({ paymentStatus: 'paid' })
            .where(eq(bookings.id, item.bookingId));
        }

        // 3.2 Si es un producto, descontar stock
        if (item.productId) {
          await tx.update(productStock)
            .set({ 
              stock: sql`${productStock.stock} - ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(and(
              eq(productStock.productId, item.productId),
              eq(productStock.centerId, data.centerId)
            ));

          // Registrar transacción de inventario
          await tx.insert(inventoryTransactions).values({
            productId: item.productId,
            centerId: data.centerId,
            userId: userId,
            type: "sale",
            quantity: -item.quantity,
            reason: `Venta ${saleNumber}`,
          });

          // Descontar de los lotes
          let remainingToDeduct = item.quantity;
          const batches = await tx.select()
            .from(productBatches)
            .where(and(
              eq(productBatches.productId, item.productId),
              eq(productBatches.centerId, data.centerId)
            ))
            .orderBy(asc(productBatches.expiryDate));

          for (const batch of batches) {
            if (remainingToDeduct <= 0) break;
            const deductFromThisBatch = Math.min(batch.quantity, remainingToDeduct);
            await tx.update(productBatches)
              .set({ quantity: batch.quantity - deductFromThisBatch })
              .where(eq(productBatches.id, batch.id));
            remainingToDeduct -= deductFromThisBatch;
          }
        }
      }

      revalidatePath("/inventory");
      revalidatePath("/purchases");
      
      return { success: true, saleId: newSale.id, saleNumber };
    });
  } catch (error) {
    console.error("Error al crear la venta:", error);
    return { success: false, error: "No se pudo procesar la venta" };
  }
}

export async function getSalesAction() {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "No autorizado" };

    const result = await db.query.sales.findMany({
      orderBy: [desc(sales.createdAt)],
      with: {
        center: true,
        items: {
          with: {
            product: true
          }
        }
      },
      limit: 100,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al obtener las ventas:", error);
    return { success: false, error: "No se pudieron obtener las ventas" };
  }
}
