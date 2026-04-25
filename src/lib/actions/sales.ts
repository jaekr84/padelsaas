"use server";

import { db } from "@/db";
import { sales, saleItems, products, productBatches, productStock, inventoryTransactions } from "@/db/schema";
import { eq, sql, asc, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createSaleAction(data: {
  customerName: string;
  paymentMethod: string;
  terminalId: string;
  centerId: string;
  subtotal: number;
  discount: number;
  charge: number;
  total: number;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}) {
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
        paymentMethod: data.paymentMethod,
        terminalId: data.terminalId,
        centerId: data.centerId,
        subtotal: data.subtotal.toString(),
        discount: data.discount.toString(),
        charge: data.charge.toString(),
        total: data.total.toString(),
        userId: userId,
      }).returning();

      // 3. Procesar ítems y descontar stock
      for (const item of data.items) {
        // Registrar el ítem de venta
        await tx.insert(saleItems).values({
          saleId: newSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
        });

        // 3.1 Descontar stock del producto en este centro
        await tx.update(productStock)
          .set({ 
            stock: sql`${productStock.stock} - ${item.quantity}`,
            updatedAt: new Date()
          })
          .where(and(
            eq(productStock.productId, item.productId),
            eq(productStock.centerId, data.centerId)
          ));

        // 3.2 Registrar transacción de inventario
        await tx.insert(inventoryTransactions).values({
          productId: item.productId,
          centerId: data.centerId,
          userId: userId,
          type: "sale",
          quantity: -item.quantity,
          reason: `Venta ${saleNumber}`,
        });

        // Descontar de los lotes (Lógica interna para mantener consistencia de vencimientos)
        let remainingToDeduct = item.quantity;
        
        // Buscamos lotes con stock de este producto en este centro, ordenados por fecha de vencimiento
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
