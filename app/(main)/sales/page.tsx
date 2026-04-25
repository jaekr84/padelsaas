import { db } from "@/db";
import { products, centers } from "@/db/schema";
import { POSView } from "@/components/sales/pos-view";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LucideHistory, LucideShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SalesPage() {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const allProducts = await db.query.products.findMany({
    where: (products, { eq }) => eq(products.isActive, true),
  });

  const allCenters = await db.query.centers.findMany();

  return (
    <div className="flex-1 bg-slate-50/50 flex flex-col h-full">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <LucideShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Punto de Venta</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kiosko & Cafetería</p>
          </div>
        </div>

        <Link href="/sales/history">
          <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 transition-all font-bold uppercase text-[10px] tracking-widest gap-2">
            <LucideHistory className="h-4 w-4" />
            Historial de Ventas
          </Button>
        </Link>
      </header>

      <div className="flex-1 overflow-hidden">
        <POSView 
          products={allProducts} 
          centers={allCenters} 
        />
      </div>
    </div>
  );
}
