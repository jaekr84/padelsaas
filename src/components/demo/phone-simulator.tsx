"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { LucideMessageSquare, LucideBell, LucideCheckCircle2, LucideClock } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: React.ReactNode;
}

export function PhoneSimulator() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Simulación de notificaciones para demo
  useEffect(() => {
    const timer1 = setTimeout(() => {
      addNotification({
        id: "1",
        title: "Tu cancha Ya",
        body: "¡Reserva Confirmada! Pavón - Cancha 1 a las 19:00hs.",
        time: "Ahora",
        icon: <LucideCheckCircle2 className="h-4 w-4 text-emerald-500" />
      });
    }, 3000);

    const timer2 = setTimeout(() => {
      addNotification({
        id: "2",
        title: "Recordatorio Operativo",
        body: "Tu turno comienza en 60 minutos. ¡No llegues tarde!",
        time: "Hace 2 min",
        icon: <LucideClock className="h-4 w-4 text-blue-800" />
      });
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const addNotification = (notif: Notification) => {
    setNotifications(prev => [notif, ...prev].slice(0, 3));
  };

  return (
    <div className="relative w-[320px] h-[650px] mx-auto lg:mx-0 group">
      {/* Marco del Teléfono (CSS Industrial) */}
      <div className="absolute inset-0 z-30 pointer-events-none border-[8px] border-slate-950 rounded-[54px] shadow-[20px_20px_0px_rgba(0,0,0,0.1)]">
        {/* Sensores / Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-950 rounded-b-3xl flex items-center justify-center gap-2 px-4">
           <div className="h-1 flex-1 bg-white/10 rounded-full"></div>
           <div className="size-1.5 rounded-full bg-white/20"></div>
        </div>
        {/* Botones laterales */}
        <div className="absolute -left-[10px] top-24 w-[3px] h-12 bg-slate-950 rounded-l-md"></div>
        <div className="absolute -left-[10px] top-40 w-[3px] h-20 bg-slate-950 rounded-l-md"></div>
        <div className="absolute -right-[10px] top-32 w-[3px] h-24 bg-slate-950 rounded-r-md"></div>
      </div>

      {/* Pantalla del Teléfono */}
      <div className="absolute top-[2%] left-[7%] right-[7%] bottom-[2%] bg-slate-900 rounded-[40px] overflow-hidden">
        {/* Wallpaper Industrial */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626225443005-930f78235e8d?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-60 grayscale"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-slate-950/80"></div>

        {/* Status Bar */}
        <div className="relative z-20 h-10 flex items-center justify-between px-8 pt-4">
           <span className="text-[10px] font-bold text-white tabular-nums">19:04</span>
           <div className="flex gap-1.5 items-center">
              <div className="h-2 w-4 border border-white/40 rounded-sm"></div>
              <div className="h-1 w-1 bg-white rounded-full"></div>
           </div>
        </div>

        {/* Lock Screen Content */}
        <div className="relative z-20 mt-12 px-6 flex flex-col items-center">
           <LucideClock className="h-12 w-12 text-white/20 mb-2" />
           <h2 className="text-5xl font-light text-white tracking-tighter mb-1">19:04</h2>
           <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em] mb-12">Sábado, 25 de Abril</p>

           {/* Notification Stack */}
           <div className="w-full space-y-3">
              {notifications.map((n, i) => (
                <div 
                  key={n.id}
                  className={cn(
                    "bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 animate-in slide-in-from-bottom-4 duration-500",
                    i === 0 ? "scale-100" : "scale-95 opacity-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-slate-950 rounded-xl flex items-center justify-center text-white shrink-0">
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black uppercase tracking-tight text-slate-900">{n.title}</span>
                          <span className="text-[8px] font-bold text-slate-400">{n.time}</span>
                       </div>
                       <p className="text-[11px] leading-tight text-slate-600 font-medium">{n.body}</p>
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-10 opacity-20">
                   <LucideBell className="h-10 w-10 mx-auto text-white" />
                </div>
              )}
           </div>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
           <div className="h-1 w-32 bg-white/30 rounded-full"></div>
        </div>
      </div>

      {/* Decorative Accents */}
      <div className="absolute -right-4 top-1/4 h-20 w-1 bg-blue-800 rounded-l-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
}
