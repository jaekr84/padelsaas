"use client";

import { useState } from "react";
import {
  LucideCheckCircle2,
  LucideEye,
  LucideEyeOff,
  LucideSave,
  LucideLoader2,
  LucidePlus,
  LucideTrash2
} from "lucide-react";
import { SPORTS } from "@/lib/constants/sports";
import { updateCourtAction, addCourtAction, deleteCourtAction } from "@/lib/actions/court";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Court {
  id: string;
  name: string;
  type: string | null;
  isPublic: boolean;
  surface: string;
}

export function CourtEditor({ initialCourts, centerId, onCourtsChange }: { 
  initialCourts: Court[], 
  centerId: string,
  onCourtsChange?: (courts: Court[]) => void
}) {
  const [courts, setCourts] = useState<Court[]>(initialCourts);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleUpdate = async (id: string, updates: Partial<Court>) => {
    setSavingId(id);
    try {
      const res = await updateCourtAction(id, updates);
      if (res.success) {
        const newCourts = courts.map(c => c.id === id ? { ...c, ...updates } : c);
        setCourts(newCourts);
        onCourtsChange?.(newCourts);
        toast.success("Cancha actualizada");
      }
    } catch (error) {
      toast.error("Error al actualizar cancha");
    } finally {
      setSavingId(null);
    }
  };

  const handleAddCourt = async () => {
    setIsAdding(true);
    try {
      const newCourtName = `Cancha ${courts.length + 1}`;
      const res = await addCourtAction({
        name: newCourtName,
        type: "padel",
        surface: "cesped",
        isPanoramic: false,
        hasLighting: true,
        centerId: centerId
      });

      if (res.success && res.court) {
        toast.success("Nueva cancha creada");
        const newCourts = [...courts, res.court];
        setCourts(newCourts);
        onCourtsChange?.(newCourts);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al crear cancha");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cancha?")) return;
    
    setSavingId(id);
    try {
      const res = await deleteCourtAction(id);
      if (res.success) {
        const newCourts = courts.filter(c => c.id !== id);
        setCourts(newCourts);
        onCourtsChange?.(newCourts);
        toast.success("Cancha eliminada");
      }
    } catch (error) {
      toast.error("Error al eliminar cancha");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inventario de Canchas</span>
          <span className="text-[10px] font-black text-blue-600 tabular-nums">{courts.length} NODOS ACTIVOS</span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleAddCourt}
          disabled={isAdding}
          className="h-9 px-4 rounded-none border-blue-600 text-blue-600 font-black uppercase text-[9px] tracking-widest hover:bg-blue-50 gap-2"
        >
          {isAdding ? <LucideLoader2 className="h-3 w-3 animate-spin" /> : <LucidePlus className="h-3 w-3" />}
          Añadir Cancha
        </Button>
      </div>

      <div className="border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 w-1/3">Identificación</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Deporte / Tipo</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Marketplace</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courts.map((court) => (
              <tr key={court.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Input 
                    value={court.name}
                    onChange={(e) => setCourts(prev => prev.map(c => c.id === court.id ? { ...c, name: e.target.value } : c))}
                    onBlur={() => handleUpdate(court.id, { name: court.name || "" })}
                    className="h-8 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none font-bold uppercase text-[10px] p-0 shadow-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <Select 
                    value={court.type || "padel"} 
                    onValueChange={(val) => handleUpdate(court.id, { type: val })}
                  >
                    <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 p-0 font-black uppercase text-[9px] tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-slate-200 shadow-xl">
                      {SPORTS.map((sport) => (
                        <SelectItem key={sport.value} value={sport.value} className="text-[10px] font-black uppercase tracking-widest py-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">
                              {sport.icon}
                            </span>
                            {sport.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                   <div className="flex justify-center">
                    <Switch 
                      checked={court.isPublic} 
                      onCheckedChange={(val) => handleUpdate(court.id, { isPublic: val })}
                      className="data-[state=checked]:bg-blue-600 scale-75"
                    />
                   </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    {savingId === court.id ? (
                      <LucideLoader2 className="h-3 w-3 animate-spin text-blue-600" />
                    ) : (
                      <LucideCheckCircle2 className="h-3 w-3 text-slate-200 group-hover:text-green-500 transition-colors" />
                    )}
                    <button 
                      onClick={() => handleDelete(court.id)}
                      disabled={savingId === court.id}
                      className="text-slate-300 hover:text-red-600 transition-colors p-1"
                    >
                      <LucideTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="text-[9px] font-medium text-slate-400 italic px-1">
        Las canchas marcadas como "Marketplace" serán visibles para reservas públicas en /explore.
      </p>
    </div>
  );
}
