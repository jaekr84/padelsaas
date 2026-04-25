"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { LucideMapPin, LucideChevronDown } from "lucide-react";
import { setActiveCenterAction } from "@/lib/actions/session";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Center {
  id: string;
  name: string;
}

export function CenterSwitcher({
  centers,
  activeId
}: {
  centers: Center[];
  activeId?: string
}) {
  const router = useRouter();
  const [currentId, setCurrentId] = useState(activeId || centers[0]?.id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeId && activeId !== currentId) {
      setCurrentId(activeId);
    }
  }, [activeId]);

  const handleSwitch = async (id: string) => {
    if (id === currentId) return;
    setLoading(true);
    try {
      await setActiveCenterAction(id);
      setCurrentId(id);
      toast.success(`SEDE: ${centers.find(c => c.id === id)?.name.toUpperCase()}`);
      router.refresh();
    } catch (error) {
      toast.error("ERROR EN CAMBIO");
    } finally {
      setLoading(false);
    }
  };

  if (centers.length === 0) {
    return <div className="h-9 w-full animate-pulse bg-slate-100 border border-slate-200 rounded-sm" />;
  }

  const currentCenter = centers.find(c => c.id === currentId);

  return (
    <div className="w-full">
      <Select
        value={currentId || ""}
        onValueChange={(val) => val && handleSwitch(val)}
        disabled={loading}
      >
        <SelectTrigger className="w-full h-9 bg-white border border-slate-200 rounded-sm transition-none px-3 focus:ring-1 focus:ring-blue-800 shadow-none">
          <div className="flex items-center gap-2.5 w-full">
            <LucideMapPin className={cn(
              "h-3.5 w-3.5 shrink-0 transition-colors",
              loading ? "text-blue-800 animate-pulse" : "text-slate-400"
            )} />
            <SelectValue placeholder="SELECCIONAR SEDE">
              <span className="text-[10px] font-bold uppercase tracking-tight text-slate-950 truncate">
                {currentCenter?.name || "SELECCIONAR SEDE"}
              </span>
            </SelectValue>
            <LucideChevronDown className="h-3.5 w-3.5 text-slate-300 ml-auto" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-sm border border-slate-200 p-0 shadow-lg bg-white min-w-[200px] animate-none overflow-hidden">
          <SelectGroup>
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Ubicaciones / Sedes</span>
            </div>
            {centers.map((center) => (
              <SelectItem 
                  key={center.id} 
                  value={center.id} 
                  className={cn(
                      "relative flex items-center cursor-pointer rounded-none py-2.5 px-3 transition-colors border-b border-slate-50 last:border-b-0",
                      "focus:bg-blue-800 focus:text-white",
                      center.id === currentId && "bg-slate-50 border-l-2 border-l-blue-800 text-blue-800 font-medium"
                  )}
              >
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  {center.name}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}




