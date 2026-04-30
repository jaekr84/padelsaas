"use client";

import { useState } from "react";
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
  LucideCreditCard,
  LucideMoreVertical,
  LucideCheck,
  LucideX,
  LucidePause
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getTodayArgentina } from "@/lib/date-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateBookingStatusAction } from "@/lib/actions/reservation-actions";
import { toast } from "sonner";

interface BookingsListProps {
  bookings: any[];
  globalDate?: string;
}

export function BookingsList({ bookings, globalDate }: BookingsListProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ id: string; data: any } | null>(null);

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

  const handleUpdateStatus = (id: string, data: any) => {
    setPendingUpdate({ id, data });
    setIsConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    if (!pendingUpdate) return;

    try {
      const res = await updateBookingStatusAction(pendingUpdate.id, pendingUpdate.data);
      if (res.success) {
        toast.success("Reserva actualizada correctamente");
        router.refresh();
      }
    } catch (e) {
      toast.error("Error al actualizar la reserva");
    } finally {
      setIsConfirmOpen(false);
      setPendingUpdate(null);
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
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 rounded-none font-bold uppercase text-[9px] tracking-tighter">Confirmada</Badge>;
      case "cancelled":
        return <Badge className="bg-red-600 hover:bg-red-700 text-white rounded-none font-bold uppercase text-[9px] tracking-tighter">Cancelada</Badge>;
      default:
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white rounded-none font-bold uppercase text-[9px] tracking-tighter">Pendiente</Badge>;
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
              <TableHead className="w-[80px] font-black uppercase text-[10px] tracking-widest text-slate-950 pl-4 border-r border-slate-200">Fecha</TableHead>
              <TableHead className="w-[140px] font-black uppercase text-[10px] tracking-widest text-slate-950 px-4 border-r border-slate-200">Horario</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 px-4 border-r border-slate-200">Cancha</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 px-4 border-r border-slate-200">Cliente / Usuario</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 px-4 border-r border-slate-200">Monto Bruto</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 px-4 text-center border-r border-slate-200">Estado</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-950 pr-4 text-right">Pagos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] bg-slate-50/50">
                  Sin registros operativos para la fecha seleccionada
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  className={cn(
                    "hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 h-12",
                    booking.status === "confirmed" && "bg-emerald-50/30",
                    booking.status === "cancelled" && "bg-red-50/30",
                    booking.status === "pending" && "bg-amber-50/30"
                  )}
                >
                  <TableCell className="pl-4 border-r border-slate-50">
                    <span className="font-xs font-bold text-slate-500 tabular-nums">
                      {new Date(booking.startTime).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 border-r border-slate-50">
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
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 font-black text-xs tabular-nums text-slate-950">
                        <span className="text-blue-800 font-normal">ARS</span>
                        {booking.price?.toLocaleString()}
                      </div>
                      {booking.amountPaid > 0 && (
                        <div className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                          <LucideCheck className="h-2 w-2" />
                          Pagado: ARS {booking.amountPaid.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-center border-r border-slate-50">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusBadge(booking.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-none hover:bg-slate-200 transition-colors outline-none cursor-pointer border-none bg-transparent">
                          <LucideMoreVertical className="h-3 w-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-2 border-slate-950 p-1">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 py-1.5">Estado Reserva</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(booking.id, { status: "confirmed" })}
                              className="text-[10px] font-bold uppercase cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50"
                            >
                              <LucideCheck className="mr-2 h-3 w-3 text-emerald-600" /> Confirmar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(booking.id, { status: "pending" })}
                              className="text-[10px] font-bold uppercase cursor-pointer hover:bg-amber-50 focus:bg-amber-50"
                            >
                              <LucidePause className="mr-2 h-3 w-3 text-amber-600" /> Pendiente
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(booking.id, { status: "cancelled" })}
                              className="text-[10px] font-bold uppercase cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600"
                            >
                              <LucideX className="mr-2 h-3 w-3" /> Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* Linked Sale Info */}
                      {(booking as any).saleItems?.[0]?.sale && (
                        <div className="flex flex-col items-end mr-2 border-r border-slate-100 pr-3">
                          <span className="text-[10px] font-black text-blue-800 uppercase tracking-tighter">
                            {(booking as any).saleItems[0].sale.saleNumber}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            {(booking as any).saleItems[0].sale.paymentMethod} • {(booking as any).saleItems[0].sale.terminalId || "Caja"}
                          </span>
                        </div>
                      )}
                      {booking.paymentStatus === "paid" ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 rounded-none font-bold uppercase text-[9px] tracking-tighter">Saldado</Badge>
                      ) : booking.paymentStatus === "partially_paid" ? (
                        <div className="flex flex-col items-end gap-1">
                          <Badge className="bg-amber-600 hover:bg-amber-700 rounded-none font-bold uppercase text-[9px] tracking-tighter">Señado (50%)</Badge>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Restan: ARS {(booking.price - (booking.amountPaid || 0)).toLocaleString()}</span>
                        </div>
                      ) : booking.status !== "cancelled" ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-widest rounded-none border-b-2 border-emerald-950 shadow-none flex items-center gap-1.5"
                          onClick={() => handleUpdateStatus(booking.id, { paymentStatus: "paid", amountPaid: booking.price })}
                        >
                          <LucideCheck className="h-3 w-3" />
                          Cobro Rápido
                        </Button>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-slate-400">---</span>
                      )}

                      {booking.paymentStatus !== "paid" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-none hover:bg-slate-200 transition-colors outline-none cursor-pointer border-none bg-transparent">
                            <LucideMoreVertical className="h-3 w-3" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-none border-2 border-slate-950 p-1">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 py-1.5">Estado Pago</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(booking.id, { paymentStatus: "paid", amountPaid: booking.price })}
                                className="text-[10px] font-bold uppercase cursor-pointer hover:bg-slate-100"
                              >
                                Marcar Pagado (100%)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(booking.id, { paymentStatus: "partially_paid", amountPaid: Math.ceil(booking.price * 0.5) })}
                                className="text-[10px] font-bold uppercase cursor-pointer hover:bg-slate-100"
                              >
                                Marcar Señado (50%)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(booking.id, { paymentStatus: "pending", amountPaid: 0 })}
                                className="text-[10px] font-bold uppercase cursor-pointer hover:bg-slate-100"
                              >
                                Restablecer a Pendiente
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
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
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="rounded-none border-2 border-slate-950 max-w-xs p-6">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-950">Confirmar cambio</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-600 uppercase leading-relaxed">
              ¿Estás seguro de que deseas cambiar el estado de esta reserva? Esta acción modificará la visibilidad y los pagos asociados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-6 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-none border-2 border-slate-950 text-[10px] font-black uppercase tracking-widest h-8 px-4"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmUpdate}
              className="rounded-none bg-blue-800 hover:bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest h-8 px-4"
            >
              Confirmar Cambio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
