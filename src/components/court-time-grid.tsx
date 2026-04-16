import React from "react";
import { cn } from "@/lib/utils";

export interface TimeGridCourt {
  id: string;
  centerId: string;
  name: string;
  type: string;
  surface: string;
  bookings?: any[];
}

interface CourtTimeGridProps {
  court: TimeGridCourt;
  timeSlots: string[];
  isSlotBooked: (court: TimeGridCourt, time: string) => boolean;
  onSlotClick?: (court: TimeGridCourt, time: string, booked: boolean) => void;
  selectedTime?: string;
  selectedDurationMins?: number;
}

export function CourtTimeGrid({
  court,
  timeSlots,
  isSlotBooked,
  onSlotClick,
  selectedTime,
  selectedDurationMins = 30,
}: CourtTimeGridProps) {
  
  // Helper to parse "HH:MM" into minutes from start of day
  const parseTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const selectedStartMins = selectedTime ? parseTime(selectedTime) : -1;
  const selectedEndMins = selectedStartMins > -1 ? selectedStartMins + selectedDurationMins : -1;

  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-2 pt-2">
      {timeSlots.map((time) => {
        const booked = isSlotBooked(court, time);
        
        // Define if this slice falls into the selected range
        const slotMins = parseTime(time);
        const isSelected = selectedStartMins !== -1 && slotMins >= selectedStartMins && slotMins < selectedEndMins;

        return (
          <div
            key={time}
            onClick={() => onSlotClick?.(court, time, booked)}
            className={cn(
              "group relative flex flex-col items-center justify-center p-2 rounded-md text-xs font-bold transition-all border shadow-sm",
              booked
                ? "bg-slate-400 border-slate-500 text-slate-50 opacity-60 cursor-not-allowed"
                : isSelected 
                  ? "bg-primary border-primary text-primary-foreground scale-105 shadow-md cursor-pointer z-10"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:scale-105 cursor-pointer"
            )}
          >
            {time}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
              <div className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap shadow-xl">
                {time} - {booked ? "Reservado" : "Disponible"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
