"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DAYS_MAP, rulesToGrid, gridToRules, PricingRule } from "@/lib/pricing-utils";
import { generateTimeSlots } from "./courts-list";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  LucidePalette, 
  LucideCheck, 
  LucideX, 
  LucideInfo,
  LucideMousePointer2,
  LucideEraser,
  LucideZap
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PricingCanvasProps {
  rules: PricingRule[];
  basePrice: number;
  onChange: (rules: PricingRule[]) => void;
  openTime?: string;
  closeTime?: string;
}

export function PricingCanvas({ 
  rules, 
  basePrice, 
  onChange,
  openTime = "08:00",
  closeTime = "23:00"
}: PricingCanvasProps) {
  const timeSlots = useMemo(() => generateTimeSlots(openTime, closeTime), [openTime, closeTime]);
  
  // Local grid state derived from rules
  const [grid, setGrid] = useState<Record<string, { price: number; priority: number }>>(() => 
    rulesToGrid(rules, basePrice, timeSlots)
  );

  // Sync grid when rules or basePrice change from outside (e.g. switching centers)
  useEffect(() => {
    const bPrice = Number(basePrice);
    const newGrid = rulesToGrid(rules, bPrice, timeSlots);
    setGrid(newGrid);
    setSelection([]);
  }, [rules, basePrice, timeSlots]);

  // Selection state
  const [selection, setSelection] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState<string | null>(null);

  // Dynamic price-to-color mapping
  const priceColors = useMemo(() => {
    const distinctPrices = Array.from(new Set(Object.values(grid).map(c => c.price)))
      .filter(p => p !== basePrice)
      .sort((a, b) => a - b);
    
    const palette = [
      "bg-emerald-500", 
      "bg-blue-500", 
      "bg-purple-600", 
      "bg-orange-500", 
      "bg-rose-500", 
      "bg-indigo-500", 
      "bg-amber-500", 
      "bg-sky-500"
    ];

    const mapping: Record<number, string> = {};
    distinctPrices.forEach((p, i) => {
      mapping[p] = palette[i % palette.length];
    });
    return mapping;
  }, [grid, basePrice]);

  const getPriceColor = (price: number) => {
    if (price === basePrice) return "bg-white hover:bg-emerald-50/50";
    return cn(priceColors[price] || "bg-slate-500", "text-white shadow-inner");
  };

  const getRangeCells = (startId: string, endId: string) => {
    const [sD, sT] = startId.split("-");
    const [eD, eT] = endId.split("-");
    const startDay = parseInt(sD);
    const endDay = parseInt(eD);
    
    const minDay = Math.min(startDay, endDay);
    const maxDay = Math.max(startDay, endDay);
    const minTime = sT < eT ? sT : eT;
    const maxTime = sT < eT ? eT : sT;
    
    const cells: string[] = [];
    for (let d = minDay; d <= maxDay; d++) {
      for (const time of timeSlots) {
        if (time >= minTime && time <= maxTime) {
          cells.push(`${d}-${time}`);
        }
      }
    }
    return cells;
  };

  const handleCellClick = (id: string) => {
    if (!rangeStart) {
      // First click: set start
      setRangeStart(id);
      setSelection([id]);
    } else {
      // Second click: finalize range
      const newRange = getRangeCells(rangeStart, id);
      setSelection(newRange);
      setRangeStart(null); // Reset for next selection
    }
  };

  const handleMouseEnter = (id: string) => {
    if (rangeStart) {
      // Preview range while moving
      const preview = getRangeCells(rangeStart, id);
      setSelection(preview);
    }
  };

  const handleMouseUp = () => {
    // We don't use dragging anymore for primary selection, 
    // but we'll keep this as a no-op to avoid breaking the select-none wrapper.
  };

  const applyPrice = (price: number) => {
    const newGrid = { ...grid };
    selection.forEach(id => {
      newGrid[id] = { price: Number(price), priority: 1 };
    });
    setGrid(newGrid);
    setSelection([]);
    
    // Notify parent with merged rules
    const newRules = gridToRules(newGrid, basePrice, timeSlots);
    onChange(newRules);
  };

  const clearSelection = () => {
    const newGrid = { ...grid };
    selection.forEach(id => {
      newGrid[id] = { price: basePrice, priority: 0 };
    });
    setGrid(newGrid);
    setSelection([]);
    
    const newRules = gridToRules(newGrid, basePrice, timeSlots);
    onChange(newRules);
  };

  return (
    <div className="flex flex-col space-y-4 select-none" onMouseUp={handleMouseUp}>
      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white border shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-border" />
            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Base: ${basePrice}</span>
          </div>
          {Object.entries(priceColors).map(([price, colorClass]) => (
            <div key={price} className="flex items-center gap-2 px-2 py-1 rounded-full bg-white border shadow-sm transition-all hover:scale-105">
              <div className={cn("w-2.5 h-2.5 rounded-full", colorClass)} />
              <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">${price}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10">
          <LucideMousePointer2 className="h-3 w-3 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-widest text-primary">Click Inicio + Click Fin</span>
        </div>
      </div>

      {/* The Canvas Grid */}
      <div className="relative overflow-hidden border rounded-xl bg-card shadow-sm">
        <div className="grid grid-cols-[80px_repeat(7,1fr)]">
          {/* Header Row */}
          <div className="h-10 border-b border-r bg-muted/20" />
          {DAYS_MAP.map(day => (
            <div key={day.id} className="h-10 border-b border-r last:border-r-0 flex items-center justify-center bg-muted/10">
              <span className="text-[11px] font-black uppercase tracking-tighter">{day.label}</span>
            </div>
          ))}

          {/* Time Rows */}
          {timeSlots.map((time, tIdx) => (
            <React.Fragment key={time}>
              {/* Time Label */}
              <div className={cn(
                "h-7 border-b border-r flex items-center justify-end pr-2 bg-muted/5",
                time.endsWith(":00") ? "opacity-100" : "opacity-30"
              )}>
                <span className="text-[9px] font-bold text-muted-foreground tabular-nums">{time}</span>
              </div>
              
              {/* Day Cells */}
              {DAYS_MAP.map(day => {
                const id = `${day.id}-${time}`;
                const cell = grid[id] || { price: basePrice, priority: 0 };
                const isSelected = selection.includes(id);
                
                return (
                  <div
                    key={id}
                    onClick={() => handleCellClick(id)}
                    onMouseEnter={() => handleMouseEnter(id)}
                    className={cn(
                      "h-7 border-b border-r last:border-r-0 transition-all cursor-pointer relative",
                      getPriceColor(cell.price),
                      isSelected && "ring-2 ring-primary ring-inset z-10 opacity-80",
                      rangeStart === id && "animate-pulse ring-offset-2 ring-2 ring-emerald-400"
                    )}
                  >
                    {cell.price !== basePrice && !isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/5">
                        <span className="text-[8px] font-black text-white drop-shadow-sm pointer-events-none">
                          ${cell.price / 1000}k
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Floating Action Bar - Now FIXED/STICKY for better UX */}
        {selection.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white/95 backdrop-blur-md border border-primary/20 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-[100] ring-1 ring-black/5">
            <div className="flex flex-col px-3 border-r mr-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">Definir Precio</span>
              <div className="flex items-center gap-1.5">
                 <LucideZap className="h-3 w-3 text-amber-500" />
                 <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{selection.length} Módulos</span>
              </div>
            </div>
            
            <PriceApplyPopup 
               onApply={applyPrice} 
               onClear={clearSelection}
               onCancel={() => setSelection([])}
               basePrice={basePrice}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PriceApplyPopup({ 
  onApply, 
  onClear,
  onCancel,
  basePrice 
}: { 
  onApply: (p: number) => void, 
  onClear: () => void,
  onCancel: () => void,
  basePrice: number 
}) {
  const [val, setVal] = useState(basePrice.toString());

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 text-[10px] font-black">$</span>
        <Input 
          type="number" 
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="h-8 w-24 pl-5 font-black text-xs border-none bg-emerald-500/5 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
          autoFocus
        />
      </div>
      
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
        onClick={() => onApply(Number(val))}
      >
        <LucideCheck className="h-4 w-4" />
      </Button>

      <Button 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 text-amber-600 hover:bg-amber-50"
        onClick={onClear}
        title="Restablecer a tarifa base"
      >
        <LucideEraser className="h-4 w-4" />
      </Button>

      <Button 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 text-muted-foreground"
        onClick={onCancel}
      >
        <LucideX className="h-4 w-4" />
      </Button>
    </div>
  );
}
