"use client";

import React, { useState, useMemo } from "react";
import { CourtTimeGrid, TimeGridCourt } from "@/components/court-time-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { createPublicBookingAction, getPlayerLastContactAction } from "@/lib/actions/public-booking";
import { 
  LucideCalendar, 
  LucideClock, 
  LucideUser, 
  LucidePhone, 
  LucideMail,
  LucideCheckCircle2,
  LucideAlertCircle,
  LucideArrowRight,
  LucideArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { parseISO, startOfDay, addMinutes, isWithinInterval, isEqual, format } from "date-fns";

interface CenterBookingViewProps {
  center: any;
}

export function CenterBookingView({ center }: CenterBookingViewProps) {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<{ court: any, time: string } | null>(null);
  const [duration, setDuration] = useState(90);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [hasStoredPhone, setHasStoredPhone] = useState(false);
  const [step, setStep] = useState(1); // 1: Selection, 2: Form, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Sincronizar datos de sesión con el formulario
  React.useEffect(() => {
    async function loadContact() {
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          name: session.user.name || prev.name,
          email: session.user.email || prev.email
        }));

        const contactRes = await getPlayerLastContactAction();
        if (contactRes.success && contactRes.data?.phone) {
          setFormData(prev => ({ ...prev, phone: contactRes.data!.phone }));
          setHasStoredPhone(true);
        }
      }
    }
    loadContact();
  }, [session]);

  // Generate time slots based on center hours
  const timeSlots = useMemo(() => {
    const openTime = center.openTime || "08:00";
    const closeTime = center.closeTime || "23:00";
    
    const toMins = (t: string) => {
      const [h, m] = (t || "08:00").trim().split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const startMins = toMins(openTime);
    const endMins = toMins(closeTime);
    const slots: string[] = [];

    if (startMins <= endMins) {
      for (let m = startMins; m <= endMins; m += 30) {
        const h = Math.floor(m / 60);
        const mins = m % 60 === 0 ? "00" : "30";
        slots.push(`${h.toString().padStart(2, '0')}:${mins}`);
      }
    } else {
      // Caso nocturno (cruza medianoche)
      for (let m = startMins; m < 1440; m += 30) {
        const h = Math.floor(m / 60);
        const mins = m % 60 === 0 ? "00" : "30";
        slots.push(`${h.toString().padStart(2, '0')}:${mins}`);
      }
      for (let m = 0; m <= endMins; m += 30) {
        const h = Math.floor(m / 60);
        const mins = m % 60 === 0 ? "00" : "30";
        slots.push(`${h.toString().padStart(2, '0')}:${mins}`);
      }
    }
    return slots;
  }, [center.openTime, center.closeTime]);

  const isSlotBooked = (court: any, time: string) => {
    if (!court.bookings || court.bookings.length === 0) return false;
    
    const [h, m] = time.split(':').map(Number);
    // Extraer componentes de la fecha seleccionada
    const [year, month, day] = selectedDate.split('-').map(Number);
    
    return court.bookings.some((b: any) => {
      // Usar objetos Date pero comparar componentes específicos para evitar desfases de zona horaria
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      
      // 1. Verificar si la reserva es el mismo día
      const isSameDay = 
        bStart.getFullYear() === year && 
        bStart.getMonth() === (month - 1) && 
        bStart.getDate() === day;
        
      if (!isSameDay) return false;

      // 2. Verificar si el slot cae dentro del rango de tiempo
      const bStartMins = bStart.getHours() * 60 + bStart.getMinutes();
      const bEndMins = bEnd.getHours() * 60 + bEnd.getMinutes();
      const slotMins = h * 60 + m;

      return (slotMins >= bStartMins && slotMins < bEndMins);
    });
  };

  const handleSlotClick = (court: any, time: string, booked: boolean) => {
    console.log("Slot Click:", { courtName: court.name, time, booked });
    if (booked) return;
    setSelectedSlot({ court, time });
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    setLoading(true);
    setError("");

    const [h, m] = selectedSlot.time.split(':').map(Number);
    const start = new Date(selectedDate);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + duration * 60000);

    const res = await createPublicBookingAction({
      courtId: selectedSlot.court.id,
      startTime: start,
      endTime: end,
      guestName: formData.name,
      guestPhone: formData.phone,
      guestEmail: formData.email,
    });

    if (res.success) {
      setStep(3);
    } else {
      setError(res.error || "Error al procesar la reserva");
    }
    setLoading(false);
  };

  if (step === 3) {
    return (
      <div className="bg-white border-2 border-slate-950 p-12 text-center space-y-8 animate-in zoom-in duration-300">
        <div className="h-20 w-20 bg-blue-800 text-white flex items-center justify-center mx-auto shadow-[6px_6px_0px_black]">
          <LucideCheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Reserva Confirmada</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Protocolo de acceso generado correctamente</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-6 text-left space-y-4">
           <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-[9px] font-black uppercase text-slate-400">Referencia</span>
              <span className="text-[10px] font-black uppercase tabular-nums">#{Math.random().toString(36).substring(7).toUpperCase()}</span>
           </div>
           <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-[9px] font-black uppercase text-slate-400">Horario</span>
              <span className="text-[10px] font-black uppercase">{selectedSlot?.time} ({duration} min)</span>
           </div>
           <div className="flex justify-between">
              <span className="text-[9px] font-black uppercase text-slate-400">Cancha</span>
              <span className="text-[10px] font-black uppercase">{selectedSlot?.court.name}</span>
           </div>
        </div>
        <Button 
          onClick={() => router.push('/explore')}
          className="w-full h-14 bg-slate-950 text-white rounded-none font-black uppercase tracking-widest hover:bg-blue-800"
        >
          Volver al Directorio
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left: Selector & Grid */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white border-2 border-slate-950 p-6 flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha del Encuentro</Label>
            <div className="relative">
              <LucideCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 h-12 rounded-none border-slate-200 font-black uppercase text-[10px]"
              />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duración</Label>
            <select 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-12 border-2 border-slate-200 px-4 bg-white font-black uppercase text-[10px] outline-none focus:border-blue-800"
            >
              <option value={60}>60 Minutos</option>
              <option value={90}>90 Minutos</option>
              <option value={120}>120 Minutos</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
             <div className="w-2 h-4 bg-blue-800" />
             <h2 className="text-xl font-black uppercase tracking-tighter">Grilla de Disponibilidad</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-10">
            {center.courts.map((court: any) => (
              <div key={court.id} className="bg-white border-2 border-slate-950 overflow-hidden transition-all hover:border-blue-800 shadow-[4px_4px_0px_black] hover:shadow-[8px_8px_0px_rgba(0,51,153,1)]">
                {/* Card Header Industrial Style */}
                <div className="p-6 border-b-2 border-slate-950 bg-slate-50/50 flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-800" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-800">Recurso Operativo</span>
                    </div>
                    <h4 className="text-3xl font-black uppercase tracking-tighter text-slate-950">{court.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{court.surface}</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-slate-950 flex items-center justify-center text-white shadow-[4px_4px_0px_#003399]">
                    <LucideCheckCircle2 className="h-6 w-6" />
                  </div>
                </div>

                {/* Card Content - Matrix View */}
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                      Disponibilidad de Grilla
                    </span>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-white border border-slate-300" />
                        <span className="text-slate-400">Libre</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-slate-100 border border-slate-200" />
                        <span className="text-slate-400">Ocupado</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 p-2">
                    <CourtTimeGrid 
                      court={court}
                      timeSlots={timeSlots}
                      isSlotBooked={isSlotBooked}
                      onSlotClick={handleSlotClick}
                      selectedTime={selectedSlot?.court.id === court.id ? selectedSlot?.time : undefined}
                      selectedDurationMins={duration}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Summary & Form */}
      <div className="lg:col-span-4">
        <div className="sticky top-24 space-y-6">
          <div className={cn(
            "bg-white border-2 border-slate-950 p-8 transition-all",
            !selectedSlot ? "opacity-50 grayscale pointer-events-none" : "shadow-[8px_8px_0px_rgba(0,51,153,1)]"
          )}>
            <div className="space-y-6">
               <h3 className="text-xl font-black uppercase tracking-tighter border-b-2 border-slate-950 pb-4">Resumen Operativo</h3>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Cancha</span>
                    <span className="text-[10px] font-black uppercase">{selectedSlot?.court.name || "---"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Fecha</span>
                    <span className="text-[10px] font-black uppercase tabular-nums">{selectedDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Inicio</span>
                    <span className="text-[10px] font-black uppercase tabular-nums">{selectedSlot?.time || "---"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-200">
                    <span className="text-[10px] font-black uppercase text-blue-800">Total Est.</span>
                    <span className="text-lg font-black tabular-nums">$ {((duration / 30) * (center.defaultPrice30 || 0)).toLocaleString()}</span>
                  </div>
               </div>

               {step === 1 ? (
                 <Button 
                   disabled={!selectedSlot}
                   onClick={() => setStep(2)}
                   className="w-full h-14 bg-slate-950 text-white rounded-none font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center justify-center gap-3"
                 >
                   Proceder a la Reserva <LucideArrowRight className="h-5 w-5" />
                 </Button>
               ) : !session ? (
                 <div className="space-y-6 pt-6 border-t-2 border-slate-950 animate-in slide-in-from-right-4 duration-300">
                    <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold uppercase tracking-tight leading-relaxed">
                      Para finalizar la reserva y asegurar tu lugar, es necesario que accedas a tu cuenta o te registres en el sistema.
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       <Button 
                         onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                         className="h-12 bg-slate-950 text-white rounded-none font-black uppercase tracking-widest hover:bg-blue-800"
                       >
                         Iniciar Sesión
                       </Button>
                       <Link 
                         href="/register" 
                         className="h-12 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                       >
                         Crear Nueva Cuenta
                       </Link>
                       <Button 
                         variant="ghost"
                         onClick={() => setStep(1)}
                         className="text-[9px] font-black uppercase tracking-widest text-slate-400"
                       >
                         <LucideArrowLeft className="h-3 w-3 mr-2" /> Volver a la Grilla
                       </Button>
                    </div>
                 </div>
               ) : (
                 <form onSubmit={handleBooking} className="space-y-6 pt-6 border-t-2 border-slate-950 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-200">
                         <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Usuario Confirmado</span>
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-800 text-white flex items-center justify-center text-xs font-black">
                               {session.user?.name?.[0]}
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-tight">{session.user?.name}</p>
                               <p className="text-[8px] font-bold text-slate-400 lowercase">{session.user?.email}</p>
                            </div>
                         </div>
                      </div>
                      {!hasStoredPhone && (
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase text-slate-400">Confirmar Teléfono de Contacto</Label>
                          <Input 
                            required
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="h-10 rounded-none border-slate-200 font-bold uppercase text-[10px]" 
                          />
                        </div>
                      )}
                      {hasStoredPhone && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100">
                           <LucidePhone className="h-3 w-3 text-blue-800" />
                           <span className="text-[9px] font-black uppercase text-blue-800">Teléfono registrado: {formData.phone}</span>
                        </div>
                      )}
                    </div>
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-[9px] font-black uppercase">
                        <LucideAlertCircle className="h-4 w-4" /> {error}
                      </div>
                    )}
                    <div className="flex gap-2">
                       <Button 
                         type="button"
                         onClick={() => setStep(1)}
                         variant="outline"
                         className="h-14 rounded-none border-2 border-slate-950 flex-1 hover:bg-slate-50 font-black uppercase text-[10px]"
                       >
                         Atrás
                       </Button>
                       <Button 
                         type="submit"
                         disabled={loading}
                         className="h-14 bg-blue-800 text-white rounded-none border-2 border-blue-900 flex-[2] hover:bg-blue-900 font-black uppercase tracking-widest"
                       >
                         {loading ? "Confirmando..." : "Confirmar Reserva"}
                       </Button>
                    </div>
                 </form>
               )}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 flex gap-3">
             <LucideClock className="h-5 w-5 text-blue-800 shrink-0" />
             <p className="text-[9px] font-bold text-blue-800 uppercase leading-relaxed tracking-tight">
               Las reservas realizadas a través de este portal están sujetas a validación por parte del centro deportivo.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
