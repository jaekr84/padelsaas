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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">¡Hola, {userName}! 👋</h1>
        <p className="text-muted-foreground text-lg">
          Bienvenido a tu centro de control de Padel SaaS.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ventas Hoy", value: salesToday.count.toString(), icon: LucideShoppingCart, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Ingresos Mes", value: formatCurrency(salesMonth?.total || 0), icon: LucideTrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Clientes Registrados", value: totalCustomers.count.toString(), icon: LucideUsers, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Ocupación", value: "78%", icon: LucideTarget, color: "text-primary", bg: "bg-primary/10" },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +12% desde la semana pasada
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-lg">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Las últimas reservas y registros de tu centro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <LucideTrendingUp className="h-5 w-5 text-emerald-600" />
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
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 border-none shadow-lg">
          <CardHeader>
            <CardTitle>Próximos Partidos</CardTitle>
            <CardDescription>
              Partidos programados para las próximas 2 horas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center font-black text-blue-600 text-xs">
                    {booking.court?.name?.split(" ").pop()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                      {booking.court?.name} - {booking.guestName || booking.user?.name || "Reserva"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </p>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                    Programado
                  </div>
                </div>
              ))}
              {upcomingBookings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No hay partidos programados próximamente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
