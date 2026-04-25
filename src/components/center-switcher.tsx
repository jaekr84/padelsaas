"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { LucideMapPin, LucideChevronDown, LucideActivity } from "lucide-react";
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
    return <div className="h-10 w-full animate-pulse bg-slate-50 border border-slate-200" />;
  }

  const currentCenter = centers.find(c => c.id === currentId);

  return (
    <div className="w-full">
      <Select
        value={currentId || ""}
        onValueChange={(val) => val && handleSwitch(val)}
        disabled={loading}
      >
        <SelectTrigger className="w-full h-10 bg-white border-slate-200 rounded-none hover:border-slate-400 transition-all px-3 focus:ring-0 shadow-sm">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 truncate">
              <LucideMapPin className={cn(
                "h-3.5 w-3.5 shrink-0 transition-colors",
                loading ? "text-blue-600 animate-pulse" : "text-slate-400"
              )} />
              <SelectValue placeholder="SELECCIONAR SEDE">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 truncate">
                  {currentCenter?.name || "SELECCIONAR SEDE"}
                </span>
              </SelectValue>
            </div>
            <LucideChevronDown className="h-3 w-3 text-slate-300 ml-2" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-none border-slate-200 p-0 shadow-2xl bg-white min-w-[200px]">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Panel de Control / Ubicaciones</span>
          </div>
          {centers.map((center) => (
            <SelectItem 
                key={center.id} 
                value={center.id} 
                className={cn(
                    "cursor-pointer rounded-none py-3 px-4 transition-colors border-l-2 border-l-transparent",
                    "focus:bg-slate-950 focus:text-white",
                    center.id === currentId && "bg-slate-50 border-l-blue-800 text-blue-800"
                )}
            >
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                {center.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
