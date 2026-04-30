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
  productBatches,
  tenants
} from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function getPurchasesAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cookieStore = await cookies();
  const activeCenterId = cookieStore.get("active_center_id")?.value || session.user.centerId;

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  return await db.query.purchases.findMany({
    where: and(
      eq(purchases.tenantId, userMember.tenantId),
      activeCenterId ? eq(purchases.centerId, activeCenterId) : sql`true`
    ),
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
  centerId?: string; // Representativo, opcional ahora que hay distribución
  invoiceNumber?: string;
  notes?: string;
  items: {
    productId: string;
    distributions: { centerId: string; quantity: number }[];
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

  // Obtener configuración de flujo de la empresa
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, userMember.tenantId),
  });

  if (!tenant) throw new Error("Empresa no encontrada");
  const isDirectFlow = tenant.purchaseFlow === "direct";

  // Calculate total across all distributions
  const total = data.items.reduce((acc, item) => {
    const itemTotalQty = item.distributions.reduce((sum, d) => sum + d.quantity, 0);
    return acc + (itemTotalQty * item.unitCost);
  }, 0);

  const cookieStore = await cookies();
  const activeCenterId = cookieStore.get("active_center_id")?.value;

  return await db.transaction(async (tx) => {
    // 1. Create Purchase
    const [newPurchase] = await tx.insert(purchases).values({
      tenantId: userMember.tenantId,
      centerId: data.centerId || activeCenterId || userMember.centerId || "", // Sede de referencia
      supplierId: data.supplierId || null,
      total,
      invoiceNumber: data.invoiceNumber,
      notes: data.notes,
    }).returning();

    for (const item of data.items) {
      for (const dist of item.distributions) {
        if (dist.quantity <= 0) continue;

        // 2. Create Purchase Item for this distribution
        await tx.insert(purchaseItems).values({
          purchaseId: newPurchase.id,
          productId: item.productId,
          centerId: dist.centerId,
          quantity: dist.quantity,
          unitCost: item.unitCost,
          subtotal: dist.quantity * item.unitCost,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          batchNumber: item.batchNumber || null,
          receivedQuantity: isDirectFlow ? dist.quantity : 0,
          status: isDirectFlow ? "received" : "pending",
        });

        // 3. Update Stock & Batches ONLY if direct flow
        if (isDirectFlow) {
          if (item.expiryDate) {
            await tx.insert(productBatches).values({
              productId: item.productId,
              centerId: dist.centerId,
              tenantId: userMember.tenantId,
              quantity: dist.quantity,
              expiryDate: new Date(item.expiryDate),
              batchNumber: item.batchNumber || null,
            });
          }

          const existingStock = await tx.query.productStock.findFirst({
            where: and(
              eq(productStock.productId, item.productId),
              eq(productStock.centerId, dist.centerId)
            ),
          });

          const previousStock = existingStock?.stock || 0;
          const newStockValue = previousStock + dist.quantity;

          if (existingStock) {
            await tx.update(productStock)
              .set({ stock: newStockValue, updatedAt: new Date() })
              .where(eq(productStock.id, existingStock.id));
          } else {
            await tx.insert(productStock).values({
              productId: item.productId,
              centerId: dist.centerId,
              stock: newStockValue,
            });
          }

          // 4. Record Inventory Transaction for this center
          await tx.insert(inventoryTransactions).values({
            productId: item.productId,
            centerId: dist.centerId,
            userId: session.user.id,
            type: "purchase",
            quantity: dist.quantity,
            reason: `Purchase ${newPurchase.invoiceNumber || newPurchase.id} (Distributed)`,
          });
        }
      }

      // 5. Update Product's buyPrice (global reference)
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

  const cookieStore = await cookies();
  const activeCenterId = cookieStore.get("active_center_id")?.value || session.user.centerId;

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return await db.query.productBatches.findMany({
    where: and(
      eq(productBatches.tenantId, userMember.tenantId),
      activeCenterId ? eq(productBatches.centerId, activeCenterId) : sql`true`,
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
