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
              "group relative flex flex-col items-center justify-center h-10 rounded-lg text-[10px] font-bold transition-all border",
              booked
                ? "bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed opacity-70"
                : isSelected 
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20 z-10 scale-[1.02]"
                  : "bg-white border-slate-300 text-slate-800 hover:border-emerald-500 hover:text-emerald-900 hover:bg-emerald-50/50"
            )}
          >
            {time}
            {booked && (
              <div className="absolute top-1 right-1">
                <div className="h-1 w-1 rounded-full bg-slate-300" />
              </div>
            )}
            {!booked && isSelected && (
              <div className="absolute -top-1 -right-1">
                <div className="h-2 w-2 rounded-full bg-white shadow-sm flex items-center justify-center">
                   <div className="h-1 w-1 rounded-full bg-emerald-600" />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
