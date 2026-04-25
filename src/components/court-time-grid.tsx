import React from "react";
import { cn } from "@/lib/utils";

export interface TimeGridCourt {
  id: string;
  centerId: string;
  name: string;
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
  isGlobalView?: boolean;
  allCourts?: TimeGridCourt[];
  dateStr?: string;
}

export function CourtTimeGrid({
  court,
  timeSlots,
  isSlotBooked,
  onSlotClick,
  selectedTime,
  selectedDurationMins = 30,
  isGlobalView = false,
  allCourts = [],
  dateStr
}: CourtTimeGridProps) {
  
  // Helper to parse "HH:MM" into minutes from start of day
  const parseTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const selectedStartMins = selectedTime ? parseTime(selectedTime) : -1;
  const selectedEndMins = selectedStartMins > -1 ? selectedStartMins + selectedDurationMins : -1;

  return (
    <div className="grid grid-cols-6 gap-1.5">
      {timeSlots.map((time) => {
        const booked = isSlotBooked(court, time);
        const slotMins = parseTime(time);
        const isSelected = selectedStartMins !== -1 && slotMins >= selectedStartMins && slotMins < selectedEndMins;

        return (
          <button
            key={time}
            type="button"
            onClick={() => onSlotClick?.(court, time, booked)}
            disabled={booked}
            className={cn(
              "group relative flex flex-col items-center justify-center h-10 rounded-none text-[10px] font-black transition-all border uppercase tracking-tighter",
              booked
                ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50"
                : isSelected 
                  ? "bg-blue-800 border-blue-900 text-white z-10 scale-[1.02] shadow-none"
                  : "bg-white border-slate-200 text-slate-950 hover:border-blue-800 hover:text-blue-800 hover:bg-blue-50/30"
            )}
          >
            {time}
            
            {/* Ocupación Visual (Solo en modo Global) */}
            {isGlobalView && !booked && allCourts.length > 0 && (
              <div className="absolute bottom-1 flex gap-0.5 px-1 w-full justify-center">
                {allCourts.map((c, i) => {
                  const isOccupied = c.bookings?.some(b => {
                    try {
                      const bStart = new Date(b.startTime);
                      const bEnd = new Date(b.endTime);
                      const slotMins = parseTime(time);
                      const startMins = bStart.getHours() * 60 + bStart.getMinutes();
                      const endMins = bEnd.getHours() * 60 + bEnd.getMinutes();
                      return slotMins >= startMins && slotMins < endMins;
                    } catch (e) { return false; }
                  });
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "h-0.5 flex-1 rounded-full transition-colors",
                        isOccupied ? "bg-slate-300" : "bg-emerald-400 shadow-[0_0_2px_rgba(52,211,153,0.5)]"
                      )} 
                    />
                  );
                })}
              </div>
            )}

            {booked && (
              <div className="absolute top-1 right-1">
                <div className="h-1 w-1 rounded-full bg-slate-400 shadow-sm" />
              </div>
            )}
            {!booked && isSelected && (
              <div className="absolute -top-1 -right-1">
                <div className="h-2 w-2 rounded-none bg-white shadow-sm flex items-center justify-center border border-slate-200">
                   <div className="h-1 w-1 rounded-none bg-blue-800" />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
