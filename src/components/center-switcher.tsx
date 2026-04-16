"use client";

import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { LucideBuilding2, LucideCheckCircle2 } from "lucide-react";
import { setActiveCenterAction } from "@/lib/actions/session";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  }, [activeId, currentId]);

  const handleSwitch = async (id: string) => {
    setLoading(true);
    try {
      await setActiveCenterAction(id);
      setCurrentId(id);
      toast.success(`Cambiaste a ${centers.find(c => c.id === id)?.name}`);
      router.refresh();
    } catch (error) {
      toast.error("Error al cambiar de sede");
    } finally {
      setLoading(false);
    }
  };

  if (centers.length === 0) {
    return (
      <div className="px-3 py-2 w-full">
        <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
      </div>
    );
  }

  const currentCenterName = centers.find(c => c.id === currentId)?.name;

  return (
    <div className="px-3 py-2 w-full">
      <Select 
        value={currentId || ""} 
        onValueChange={(val) => val && handleSwitch(val)}
        disabled={loading}
      >
        <SelectTrigger className="w-full bg-background/50 border-muted hover:bg-accent transition-colors">
          <div className="flex items-center gap-2 truncate">
            <LucideBuilding2 className="h-4 w-4 text-primary shrink-0" />
            <SelectValue placeholder="Seleccionar sede">
              {currentCenterName || "Seleccionar sede"}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {centers.map((center) => (
            <SelectItem key={center.id} value={center.id} className="cursor-pointer">
              <div className="flex items-center gap-2">
                <span>{center.name}</span>
                {center.id === currentId && (
                  <LucideCheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
