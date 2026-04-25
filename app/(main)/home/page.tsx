import { auth } from "@/auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  LucideCalendar, 
  LucideTrendingUp, 
  LucideUsers, 
  LucideTarget,
  LucideShoppingCart
} from "lucide-react";
import { db } from "@/db";
import { bookings, sales, users, courts, customers } from "@/db/schema";
import { count, sql, and, gte, lte, asc, desc } from "drizzle-orm";
import { formatCurrency, formatTime } from "@/lib/formatters";

export default async function HomePage() {
  const session = await auth();
  const userName = session?.user?.name?.split(" ")[0] || "Administrador";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Ventas de Hoy
  const [salesToday] = await db
    .select({ count: count() })
    .from(sales)
    .where(
      and(
        gte(sales.createdAt, today),
        lte(sales.createdAt, tomorrow)
      )
    );

  // 2. Ingresos Mes Corriente (Suma de Ventas)
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [salesMonth] = await db
    .select({ total: sql<number>`COALESCE(sum(cast(${sales.total} as numeric)), 0)` })
    .from(sales)
    .where(gte(sales.createdAt, firstDayOfMonth));

  // 3. Clientes Registrados
  const [totalCustomers] = await db
    .select({ count: count() })
    .from(customers);

  // 4. Próximos Partidos (Reservas que aún no terminaron)
  const upcomingBookings = await db.query.bookings.findMany({
    where: gte(bookings.endTime, new Date()),
    with: {
      court: true,
      user: true,
    },
    orderBy: [asc(bookings.startTime)],
    limit: 6,
  });

  // 5. Actividad Reciente (Últimas ventas)
  const recentSales = await db.query.sales.findMany({
    orderBy: [desc(sales.createdAt)],
    limit: 5,
    with: {
      center: true
    }
  });
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">
          Terminal: {userName}
        </h1>
        <p className="text-slate-500 font-mono text-[9px] uppercase tracking-wider">
          Estado del Sistema • Centro de Alto Rendimiento • {new Date().toLocaleDateString('es-AR')}
        </p>
      </div>

      <div className="grid gap-px bg-slate-200 border border-slate-200">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px">
          {[
            { label: "Ventas Hoy", value: salesToday.count.toString(), icon: LucideShoppingCart, color: "text-blue-800" },
            { label: "Ingresos Mes", value: formatCurrency(salesMonth?.total || 0), icon: LucideTrendingUp, color: "text-slate-950" },
            { label: "Clientes Registrados", value: totalCustomers.count.toString(), icon: LucideUsers, color: "text-blue-900" },
            { label: "Ocupación", value: "78%", icon: LucideTarget, color: "text-slate-800" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 flex flex-col justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tighter text-slate-950">{stat.value}</div>
                <div className="mt-2 h-1 w-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-800 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-none overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Monitor de Actividad</h3>
          </div>
          <div className="p-0">
            <div className="space-y-px bg-slate-100">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 border border-slate-200 flex items-center justify-center">
                      <LucideTrendingUp className="h-4 w-4 text-slate-900" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                        Venta {sale.saleNumber}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {sale.customerName} • {formatTime(sale.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">
                      {formatCurrency(sale.total)}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {sale.paymentMethod}
                    </p>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm italic">
                  No hay ventas registradas recientemente
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-none overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Próximos Partidos</h3>
          </div>
          <div className="p-0">
            <div className="space-y-px bg-slate-100 border border-slate-100">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-slate-950 flex items-center justify-center font-bold text-white text-[10px]">
                      {booking.court?.name?.split(" ").pop()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                        {booking.court?.name} - {booking.guestName || booking.user?.name || "Reserva"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-blue-800 border border-blue-800/20 px-2 py-1">
                    CONFIRMADO
                  </div>
                </div>
              ))}
              {upcomingBookings.length === 0 && (
                <div className="bg-white p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  No hay partidos programados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
