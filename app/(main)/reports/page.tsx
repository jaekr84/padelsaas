import { auth } from "@/auth";
import { db } from "@/db";
import { sales, saleItems, productCategories, purchases } from "@/db/schema";
import { eq, sql, gte, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/formatters";
import { DashboardCharts } from "@/components/reports/dashboard-charts";
import { ReportFilters } from "@/components/reports/report-filters";
import { lte } from "drizzle-orm";
import { 
  LucideTrendingUp, 
  LucideTrendingDown, 
  LucideDollarSign, 
  LucideShoppingBag 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  // Parámetros de búsqueda
  const period = (searchParams?.period as string) || "month";
  const selectedMonth = (searchParams?.month as string) || new Date().toISOString().slice(0, 7);
  const selectedYear = (searchParams?.year as string) || new Date().getFullYear().toString();

  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  if (period === "month") {
    const [year, month] = selectedMonth.split("-").map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
    periodLabel = startDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  } else {
    const year = Number(selectedYear);
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
    periodLabel = `Año ${selectedYear}`;
  }

  // 1. Obtener ventas del periodo
  const periodSales = await db.query.sales.findMany({
    where: and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)),
    with: {
      items: {
        with: {
          category: true,
          product: true,
        }
      }
    }
  });

  // 2. Obtener compras del periodo
  const periodPurchases = await db.query.purchases.findMany({
    where: and(gte(purchases.createdAt, startDate), lte(purchases.createdAt, endDate)),
  });

  // 3. Procesar datos para gráficos
  
  // A. Ventas por Categoría
  const salesByCategoryMap = new Map<string, number>();
  periodSales.forEach(sale => {
    sale.items.forEach(item => {
      const catName = item.category?.name || "Otros";
      const amount = Number(item.totalPrice) || 0;
      salesByCategoryMap.set(catName, (salesByCategoryMap.get(catName) || 0) + amount);
    });
  });

  const categoryData = Array.from(salesByCategoryMap.entries()).map(([name, value]) => ({
    name,
    value
  }));

  // B. Ventas por Medio de Pago
  const salesByPaymentMap = new Map<string, number>();
  periodSales.forEach(sale => {
    const method = sale.paymentMethod || "Otro";
    const amount = Number(sale.total) || 0;
    salesByPaymentMap.set(method, (salesByPaymentMap.get(method) || 0) + amount);
  });

  const paymentData = Array.from(salesByPaymentMap.entries()).map(([name, value]) => ({
    name,
    value
  }));

  // C. Tendencia de Ventas
  const trendDataMap = new Map<string, number>();
  
  if (period === "month") {
    periodSales.forEach(sale => {
      const date = sale.createdAt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      trendDataMap.set(date, (trendDataMap.get(date) || 0) + Number(sale.total));
    });
  } else {
    // Inicializar meses para reporte anual
    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate.getFullYear(), i, 1);
      const label = d.toLocaleDateString('es-AR', { month: 'short' });
      trendDataMap.set(label, 0);
    }
    periodSales.forEach(sale => {
      const label = sale.createdAt.toLocaleDateString('es-AR', { month: 'short' });
      trendDataMap.set(label, (trendDataMap.get(label) || 0) + Number(sale.total));
    });
  }

  const trendData = Array.from(trendDataMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => {
      if (period === "month") return a.date.localeCompare(b.date);
      return 0; // El orden de inserción de meses ya es correcto
    });

  // D. Ventas de los últimos 12 meses
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const yearSales = await db.query.sales.findMany({
    where: gte(sales.createdAt, twelveMonthsAgo),
    orderBy: [desc(sales.createdAt)]
  });

  const monthlySummaryMap = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
    monthlySummaryMap.set(label, 0);
  }

  yearSales.forEach(sale => {
    const label = sale.createdAt.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
    if (monthlySummaryMap.has(label)) {
      monthlySummaryMap.set(label, (monthlySummaryMap.get(label) || 0) + Number(sale.total));
    }
  });

  const yearData = Array.from(monthlySummaryMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .reverse();

  // 4. KPIs
  const totalSales = periodSales.reduce((acc, s) => acc + Number(s.total), 0);
  const totalPurchases = periodPurchases.reduce((acc, p) => acc + Number(p.total), 0);
  const netBalance = totalSales - totalPurchases;
  const avgTicket = periodSales.length > 0 ? totalSales / periodSales.length : 0;

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Reportes Generales</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Resumen de rendimiento • {periodLabel}</p>
        </div>
        <ReportFilters />
      </div>

      {/* Row 1: KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ventas Totales", value: formatCurrency(totalSales), icon: LucideTrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Compras Stock", value: formatCurrency(totalPurchases), icon: LucideTrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Balance Neto", value: formatCurrency(netBalance), icon: LucideDollarSign, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Ticket Promedio", value: formatCurrency(avgTicket), icon: LucideShoppingBag, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</CardTitle>
              <div className={`${kpi.bg} ${kpi.color} p-2 rounded-xl group-hover:scale-110 transition-transform`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tighter text-slate-900">{kpi.value}</div>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Actualizado hace instantes</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2 & 3: Charts (Client Component) */}
      <DashboardCharts 
        categoryData={categoryData} 
        paymentData={paymentData} 
        trendData={trendData} 
        yearData={yearData}
      />
    </div>
  );
}
