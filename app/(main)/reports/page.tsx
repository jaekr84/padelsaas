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

export default async function ReportsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
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

  // 1. Obtener datos con consultas planas (Estabilidad máxima)
  const [periodSales, allSaleItems, allCategories, periodPurchases] = await Promise.all([
    db.select().from(sales).where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate))),
    db.select().from(saleItems),
    db.select().from(productCategories),
    db.select().from(purchases).where(and(gte(purchases.createdAt, startDate), lte(purchases.createdAt, endDate)))
  ]);

  // Mapeos rápidos para agregación
  const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));
  const saleItemsBySaleId = allSaleItems.reduce((acc, item) => {
    if (!item.saleId) return acc;
    if (!acc[item.saleId]) acc[item.saleId] = [];
    acc[item.saleId].push(item);
    return acc;
  }, {} as Record<string, typeof allSaleItems>);

  // 2. Procesar datos para gráficos
  
  // A. Ventas por Categoría
  const salesByCategoryMap = new Map<string, number>();
  periodSales.forEach(sale => {
    const items = saleItemsBySaleId[sale.id] || [];
    items.forEach(item => {
      const catName = categoryMap.get(item.categoryId!) || "Otros";
      const amount = Number(item.totalPrice) || 0;
      salesByCategoryMap.set(catName, (salesByCategoryMap.get(catName) || 0) + amount);
    });
  });

  const categoryData = Array.from(salesByCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // B. Ventas por Medio de Pago
  const salesByPaymentMap = new Map<string, number>();
  periodSales.forEach(sale => {
    const method = sale.paymentMethod || "Efectivo";
    const amount = Number(sale.total) || 0;
    salesByPaymentMap.set(method, (salesByPaymentMap.get(method) || 0) + amount);
  });

  const paymentData = Array.from(salesByPaymentMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // C. Tendencia de Ventas
  const trendDataMap = new Map<string, number>();
  
  if (period === "month") {
    // Inicializar todos los días del mes
    const daysInMonth = endDate.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const label = d.toString().padStart(2, '0');
      trendDataMap.set(label, 0);
    }

    periodSales.forEach(sale => {
      const day = sale.createdAt.getDate().toString().padStart(2, '0');
      trendDataMap.set(day, (trendDataMap.get(day) || 0) + Number(sale.total));
    });
  } else {
    // Inicializar meses para reporte anual
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    months.forEach(m => trendDataMap.set(m, 0));

    periodSales.forEach(sale => {
      const monthIdx = sale.createdAt.getMonth();
      const label = months[monthIdx];
      trendDataMap.set(label, (trendDataMap.get(label) || 0) + Number(sale.total));
    });
  }

  const trendData = Array.from(trendDataMap.entries())
    .map(([date, amount]) => ({ date, amount }));

  // D. Ventas de los últimos 12 meses
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const yearSalesList = await db.select().from(sales)
    .where(gte(sales.createdAt, twelveMonthsAgo))
    .orderBy(desc(sales.createdAt));

  const monthlySummaryMap = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
    monthlySummaryMap.set(label, 0);
  }

  yearSalesList.forEach(sale => {
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
    <div className="p-4 space-y-4 bg-white min-h-screen animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">Reportes Generales</h1>
          <p className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">Análisis de Rendimiento • {periodLabel}</p>
        </div>
        <ReportFilters />
      </div>

      {/* Row 1: KPIs en Grilla Industrial Refinada */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Ventas Totales", value: formatCurrency(totalSales), icon: LucideTrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Compras Stock", value: formatCurrency(totalPurchases), icon: LucideTrendingDown, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Balance Neto", value: formatCurrency(netBalance), icon: LucideDollarSign, color: "text-blue-700", bg: "bg-blue-50/50" },
          { label: "Ticket Promedio", value: formatCurrency(avgTicket), icon: LucideShoppingBag, color: "text-slate-900", bg: "bg-slate-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-6 border border-slate-200 flex flex-col justify-between hover:border-blue-200 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">{kpi.label}</span>
              <div className={`${kpi.bg} p-2 rounded-none transition-transform group-hover:scale-110`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tighter text-slate-950 tabular-nums">{kpi.value}</div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-blue-600 animate-pulse" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sincronizado</p>
              </div>
            </div>
          </div>
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
