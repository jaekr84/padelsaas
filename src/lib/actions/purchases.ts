"use server";

import { db } from "@/db";
import { 
  purchases, 
  purchaseItems, 
  productStock, 
  inventoryTransactions, 
  suppliers,
  members,
  products,
  productBatches
} from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPurchasesAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  return await db.query.purchases.findMany({
    where: eq(purchases.tenantId, userMember.tenantId),
    with: {
      supplier: true,
      center: true,
      items: {
        with: {
          product: true
        }
      }
    },
    orderBy: (purchases, { desc }) => [desc(purchases.createdAt)],
  });
}

export async function getSuppliersAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  return await db.query.suppliers.findMany({
    where: eq(suppliers.tenantId, userMember.tenantId),
    orderBy: (suppliers, { asc }) => [asc(suppliers.name)],
  });
}

export async function addPurchaseAction(data: {
  supplierId?: string;
  centerId: string;
  invoiceNumber?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
    expiryDate?: string;
    batchNumber?: string;
  }[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  // Calculate total
  const total = data.items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

  return await db.transaction(async (tx) => {
    // 1. Create Purchase
    const [newPurchase] = await tx.insert(purchases).values({
      tenantId: userMember.tenantId,
      centerId: data.centerId,
      supplierId: data.supplierId || null,
      total,
      invoiceNumber: data.invoiceNumber,
      notes: data.notes,
    }).returning();

    for (const item of data.items) {
      await tx.insert(purchaseItems).values({
        purchaseId: newPurchase.id,
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.quantity * item.unitCost,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        batchNumber: item.batchNumber || null,
      });

      // 3. Update Stock & Batches
      if (item.expiryDate) {
        await tx.insert(productBatches).values({
          productId: item.productId,
          centerId: data.centerId,
          tenantId: userMember.tenantId,
          quantity: item.quantity,
          expiryDate: new Date(item.expiryDate),
          batchNumber: item.batchNumber || null,
        });
      }
      const existingStock = await tx.query.productStock.findFirst({
        where: and(
          eq(productStock.productId, item.productId),
          eq(productStock.centerId, data.centerId)
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
          centerId: data.centerId,
          stock: newStockValue,
        });
      }

      // 4. Record Inventory Transaction
      await tx.insert(inventoryTransactions).values({
        productId: item.productId,
        centerId: data.centerId,
        userId: session.user.id,
        type: "purchase",
        quantity: item.quantity,
        reason: `Purchase ${newPurchase.invoiceNumber || newPurchase.id}`,
      });

      // 5. Update Product's buyPrice (optional but recommended)
      await tx.update(products)
        .set({ buyPrice: item.unitCost, updatedAt: new Date() })
        .where(eq(products.id, item.productId));
    }

    revalidatePath("/inventory");
    revalidatePath("/purchases");
    return newPurchase;
  });
}

export async function addSupplierAction(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  const [newSupplier] = await db.insert(suppliers).values({
    name,
    tenantId: userMember.tenantId,
  }).returning();

  revalidatePath("/purchases");
  return newSupplier;
}

export async function getExpiringProductsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return await db.query.productBatches.findMany({
    where: and(
      eq(productBatches.tenantId, userMember.tenantId),
      sql`${productBatches.expiryDate} <= ${thirtyDaysFromNow}`,
      sql`${productBatches.quantity} > 0`
    ),
    with: {
      product: true,
      center: true,
    },
    orderBy: (productBatches, { asc }) => [asc(productBatches.expiryDate)],
  });
}
