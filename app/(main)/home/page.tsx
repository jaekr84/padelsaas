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
  LucideTarget 
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  const userName = session?.user?.name?.split(" ")[0] || "Administrador";

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
          { label: "Reservas Hoy", value: "24", icon: LucideCalendar, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Ingresos Mes", value: "$124,500", icon: LucideTrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Jugadores Activos", value: "842", icon: LucideUsers, color: "text-orange-500", bg: "bg-orange-500/10" },
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
            <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
              [Gráfico de Actividad]
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
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    C{i}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Cancha {i} - Americano</p>
                    <p className="text-xs text-muted-foreground">19:30 - 21:00</p>
                  </div>
                  <div className="text-xs font-medium text-green-500">Ocupado</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
