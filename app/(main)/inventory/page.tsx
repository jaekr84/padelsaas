import { getProductsAction, getProductCategoriesAction } from "@/lib/actions/products";
import { InventoryView } from "@/components/inventory/inventory-view";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const [products, categories] = await Promise.all([
    getProductsAction(),
    getProductCategoriesAction(),
  ]);

  return (
    <div className="container mx-auto py-6">
      <InventoryView products={products} categories={categories} />
    </div>
  );
}
