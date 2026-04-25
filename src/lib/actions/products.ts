"use server";

import { db } from "@/db";
import { products, productCategories, members, tenants } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProductsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  return await db.query.products.findMany({
    where: eq(products.tenantId, userMember.tenantId),
    with: {
      category: true,
      stock: true,
    },
    orderBy: (products, { asc }) => [asc(products.name)],
  });
}

export async function addProductAction(data: {
  name: string;
  description?: string;
  sku?: string;
  buyPrice: number;
  sellPrice: number;
  categoryId?: string;
  minStock: number;
  imageUrl?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  const [newProduct] = await db.insert(products).values({
    ...data,
    tenantId: userMember.tenantId,
  }).returning();

  revalidatePath("/inventory");
  return newProduct;
}

export async function updateProductAction(id: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteProductAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(products).where(eq(products.id, id));

  revalidatePath("/inventory");
  return { success: true };
}

export async function getProductCategoriesAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  return await db.query.productCategories.findMany({
    where: eq(productCategories.tenantId, userMember.tenantId),
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
}

export async function addProductCategoryAction(name: string, description?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userMember = await db.query.members.findFirst({
    where: eq(members.userId, session.user.id),
  });

  if (!userMember) throw new Error("No tenant found");

  const [newCategory] = await db.insert(productCategories).values({
    name,
    description,
    tenantId: userMember.tenantId,
  }).returning();

  revalidatePath("/inventory");
  return newCategory;
}
