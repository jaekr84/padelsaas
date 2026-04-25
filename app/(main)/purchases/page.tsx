import { getPurchasesAction, getSuppliersAction, getExpiringProductsAction } from "@/lib/actions/purchases";
import { getProductsAction, getProductCategoriesAction } from "@/lib/actions/products";
import { db } from "@/db";
import { centers } from "@/db/schema";
import { PurchasesView } from "@/components/purchases/purchases-view";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PurchasesPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  // Fetch all necessary data
  const [purchases, suppliers, products, categories, allCenters, expiringProducts] = await Promise.all([
    getPurchasesAction(),
    getSuppliersAction(),
    getProductsAction(),
    getProductCategoriesAction(),
    db.query.centers.findMany(),
    getExpiringProductsAction(),
  ]);

  return (
    <div className="container mx-auto py-6">
      <PurchasesView 
        initialPurchases={purchases} 
        suppliers={suppliers} 
        products={products}
        categories={categories}
        centers={allCenters}
        expiringProducts={expiringProducts}
      />
    </div>
  );
}
