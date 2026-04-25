import { db } from "@/db";
import { products, centers, bookings } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { POSView } from "@/components/sales/pos-view";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const unpaidBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.paymentStatus, "pending"),
      gte(bookings.startTime, todayStart),
      lte(bookings.startTime, tomorrowStart)
    ),
    with: {
      court: true,
      user: true,
    }
  });

  const allTerminals = await db.query.terminals.findMany({
    where: (t, { eq }) => eq(t.isActive, true),
  });

  const allPaymentMethods = await db.query.paymentMethods.findMany({
    where: (pm, { eq }) => eq(pm.isActive, true),
  });

  return (
    <div className="flex-1 bg-white flex flex-col h-full animate-in fade-in duration-500">
      <header className="bg-white border-b border-slate-200 px-1 py-1 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-950 flex items-center justify-center text-white">
            <LucideShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">Terminal de Ventas</h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Kiosko & Cafetería • Operación en Vivo</p>
          </div>
        </div>

        <Link href="/sales/history">
          <Button variant="outline" className="rounded-none border-slate-200 hover:bg-slate-50 transition-all font-bold uppercase text-[10px] tracking-widest gap-2 h-10 px-6">
            <LucideHistory className="h-4 w-4" />
            Historial
          </Button>
        </Link>
      </header>

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="h-full flex items-center justify-center font-bold uppercase text-slate-400 animate-pulse">Iniciando Terminal...</div>}>
          <POSView
            products={allProducts}
            centers={allCenters}
            unpaidBookings={unpaidBookings}
          />
        </Suspense>
      </div>
    </div>
  );
}
