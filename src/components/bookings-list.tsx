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
  LucideDollarSign,
  LucideCreditCard
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getTodayArgentina } from "@/lib/date-utils";

interface BookingsListProps {
  bookings: any[];
  globalDate?: string;
}

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
        return <Badge className="bg-blue-800 hover:bg-blue-900 rounded-none font-bold uppercase text-[9px] tracking-tighter">Confirmada</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="rounded-none font-bold uppercase text-[9px] tracking-tighter">Cancelada</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-none font-bold uppercase text-[9px] tracking-tighter text-slate-700">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Date Navigator Header - Industrial Style */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-0 border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-slate-200 flex items-center">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-950">Historial Operativo</h3>
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="h-11 w-11 rounded-none border-l border-slate-200 hover:bg-slate-50"
          >
            <LucideChevronLeft className="h-4 w-4 text-slate-600" />
          </Button>

          <div className="relative flex items-center h-11 px-2 border-l border-slate-200">
            <LucideCalendar className="absolute left-4 h-3.5 w-3.5 text-blue-800" />
            <Input
              type="date"
              value={rawDateStr}
              onChange={handleDateChange}
              className="border-0 shadow-none h-full bg-transparent text-xs font-black uppercase tracking-tight cursor-pointer focus-visible:ring-0 pl-10 pr-4 w-40"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            className="h-11 w-11 rounded-none border-l border-slate-200 hover:bg-slate-50"
          >
            <LucideChevronRight className="h-4 w-4 text-slate-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-11 px-6 border-l border-slate-200 rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 text-blue-800"
          >
            Actual
          </Button>
        </div>
      </div>

      {/* Bookings Table - Accounting Style */}
      <div className="border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100 border-b border-slate-200">
            <TableRow className="hover:bg-transparent h-10">
              <TableHead className="w-[140px] font-black uppercase text-[10px] tracking-widest text-slate-950 pl-4 border-r border-slate-200">Horario</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 px-4 border-r border-slate-200">Cancha</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 px-4 border-r border-slate-200">Cliente / Usuario</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 px-4 border-r border-slate-200">Monto Bruto</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 px-4 text-center border-r border-slate-200">Estado</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 pr-4 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] bg-slate-50/50">
                  Sin registros operativos para la fecha seleccionada
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 h-12">
                  <TableCell className="pl-4 border-r border-slate-50">
                    <div className="flex items-center gap-2">
                      <LucideClock className="h-3 w-3 text-blue-800" />
                      <span className="text-xs font-black tabular-nums">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 border-r border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-blue-800" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-tighter">
                        {booking.court?.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 border-r border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-700">
                        {booking.guestName || booking.user?.name || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 border-r border-slate-50">
                    <div className="flex items-center gap-1 font-black text-xs tabular-nums text-slate-950">
                      <span className="text-blue-800 font-normal">ARS</span>
                      {booking.price?.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-center border-r border-slate-50">
                    {getStatusBadge(booking.status)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {booking.paymentStatus === "pending" && booking.status !== "cancelled" ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 px-3 bg-blue-800 hover:bg-blue-900 text-white font-black uppercase text-[9px] tracking-widest rounded-none border-b-2 border-blue-950 shadow-none"
                        onClick={() => router.push(`/sales?bookingId=${booking.id}`)}
                      >
                        Cobrar
                      </Button>
                    ) : booking.paymentStatus === "paid" ? (
                      <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">Procesado</span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-slate-400">---</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer - Technical Report Style */}
      {bookings.length > 0 && (
        <div className="flex items-stretch justify-end border border-slate-200 bg-slate-950 text-white">
          <div className="px-6 py-4 border-r border-slate-800 flex flex-col items-end justify-center">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Volumen Total</span>
            <span className="text-lg font-black tabular-nums">
              {bookings.length} <span className="text-[10px] text-slate-500 font-normal ml-1">RESERVAS</span>
            </span>
          </div>
          <div className="px-8 py-4 bg-blue-800 flex flex-col items-end justify-center min-w-[200px]">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-200/60 mb-1">Caja Bruta Proyectada</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-medium text-blue-200">ARS</span>
              <span className="text-2xl font-black tabular-nums">
                {bookings.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
