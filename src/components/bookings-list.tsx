"use client";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  LucideChevronLeft, 
  LucideChevronRight, 
  LucideCalendar,
  LucideSearch,
  LucideClock,
  LucideUser,
  LucideLayoutGrid,
  LucideDollarSign
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BookingsListProps {
  bookings: any[];
  globalDate?: string;
}

import { getTodayArgentina } from "@/lib/date-utils";

export function BookingsList({ bookings, globalDate }: BookingsListProps) {
  const router = useRouter();
  const rawDateStr = globalDate || getTodayArgentina();
  const [_y, _m, _d] = rawDateStr.split('-').map(Number);
  const activeDateObj = new Date(_y, _m - 1, _d);

  const handlePrevDay = () => {
    const prev = new Date(activeDateObj);
    prev.setDate(prev.getDate() - 1);
    router.push(`/bookings?date=${prev.toISOString().split("T")[0]}`);
  };
  
  const handleNextDay = () => {
    const next = new Date(activeDateObj);
    next.setDate(next.getDate() + 1);
    router.push(`/bookings?date=${next.toISOString().split("T")[0]}`);
  };

  const handleToday = () => {
    router.push('/bookings');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      router.push(`/bookings?date=${e.target.value}`);
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(d);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase text-[10px]">Confirmada</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="font-bold uppercase text-[10px]">Cancelada</Badge>;
      default:
        return <Badge variant="secondary" className="font-bold uppercase text-[10px]">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Navigator Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold tracking-tight">Listado de Reservas</h3>
        
        <div className="flex bg-card items-center border border-border shadow-sm rounded-lg p-1 mx-auto sm:mx-0">
          <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-8 w-8 hover:bg-muted">
            <LucideChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-2 border-x border-border/50 mx-1 flex items-center">
             <Input 
               type="date"
               value={rawDateStr}
               onChange={handleDateChange}
               className="border-0 shadow-none h-8 bg-transparent text-sm font-bold tracking-tight cursor-pointer focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
             />
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8 hover:bg-muted">
            <LucideChevronRight className="h-4 w-4" />
          </Button>
          <div className="border-l border-border/50 h-4 mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleToday} 
            className="h-8 px-2 text-[10px] font-black uppercase hover:bg-muted"
          >
            Hoy
          </Button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-black">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-[120px] font-black uppercase text-[10px] tracking-widest">Horario</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Cancha</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Cliente</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Monto</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground uppercase text-xs font-bold tracking-widest opacity-50">
                  No hay reservas para este día
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <LucideClock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-black whitespace-nowrap">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <LucideLayoutGrid className="h-3 w-3 text-emerald-600/70" />
                      <span className="text-sm font-bold text-emerald-950 uppercase tracking-tighter">
                        {booking.court?.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <LucideUser className="h-3 w-3 text-primary" />
                        </div>
                      <span className="text-sm font-medium">
                        {booking.guestName || booking.user?.name || "Sin Nombre"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-black text-sm">
                      <span className="text-emerald-700">$</span>
                      {booking.price?.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {getStatusBadge(booking.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer */}
      {bookings.length > 0 && (
        <div className="flex items-center justify-end gap-6 p-4 bg-muted/20 rounded-lg border border-border">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Recaudado</span>
            <span className="text-xl font-black text-emerald-700">
               $ {bookings.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cantidad</span>
            <span className="text-xl font-black">
               {bookings.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
