"use client";

import React from "react";
import { 
  LucideLaptop, 
  LucidePlus, 
  LucideCreditCard, 
  LucideTrash2, 
  LucidePower, 
  LucideBanknote, 
  LucideSmartphone,
  LucideSettings2,
  LucideMonitor,
  LucideCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  createTerminalAction, 
  toggleTerminalStatusAction,
  updateTerminalNameAction,
  createPaymentMethodAction,
  togglePaymentMethodStatusAction,
  updatePaymentMethodNameAction
} from "@/lib/actions/settings";

interface POSSettingsProps {
  initialTerminals: any[];
  initialPaymentMethods: any[];
}

export function POSSettings({ initialTerminals, initialPaymentMethods }: POSSettingsProps) {
  const [terminalName, setTerminalName] = React.useState("");
  const [pmName, setPmName] = React.useState("");
  const [pmType, setPmType] = React.useState("cash");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");

  const handleCreateTerminal = async () => {
    if (!terminalName.trim()) return;
    const res = await createTerminalAction(terminalName);
    if (res.success) {
      toast.success("Terminal habilitada");
      setTerminalName("");
    } else {
      toast.error(res.error);
    }
  };

  const handleCreatePM = async () => {
    if (!pmName.trim()) return;
    const res = await createPaymentMethodAction({ name: pmName, type: "other" });
    if (res.success) {
      toast.success("Canal de cobro registrado");
      setPmName("");
    } else {
      toast.error(res.error);
    }
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const saveTerminalName = async (id: string) => {
    if (!editValue.trim()) return setEditingId(null);
    const res = await updateTerminalNameAction(id, editValue);
    if (res.success) {
      toast.success("Etiqueta actualizada");
    } else {
      toast.error(res.error);
    }
    setEditingId(null);
  };

  const savePMName = async (id: string) => {
    if (!editValue.trim()) return setEditingId(null);
    const res = await updatePaymentMethodNameAction(id, editValue);
    if (res.success) {
      toast.success("Canal actualizado");
    } else {
      toast.error(res.error);
    }
    setEditingId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-500">
      {/* Sección de Terminales */}
      <div className="space-y-6 flex flex-col">
        <div className="flex items-center gap-3">
            <LucideMonitor className="h-5 w-5 text-slate-950" />
            <h3 className="font-black uppercase text-sm tracking-widest text-slate-950">Terminales Operativas</h3>
        </div>
        
        <div className="bg-white border border-slate-200 p-8 space-y-8 flex-1">
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Registro de Nueva Terminal</label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="ETIQUETA (EJ: CAJA CENTRAL, MÓVIL 01...)" 
                        value={terminalName}
                        onChange={(e) => setTerminalName(e.target.value)}
                        className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-[10px] tracking-widest"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateTerminal()}
                    />
                    <Button onClick={handleCreateTerminal} className="bg-slate-950 hover:bg-black text-white rounded-none px-6 h-12 shadow-none">
                        <LucidePlus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Terminales Registradas en Sistema</span>
                <div className="divide-y divide-slate-100 border border-slate-100">
                    {initialTerminals.map((t) => (
                        <div key={t.id} className={cn(
                            "p-4 flex items-center justify-between transition-all group",
                            t.isActive ? "bg-white" : "bg-slate-50/50 opacity-60"
                        )}>
                            <div className="flex items-center gap-4 flex-1">
                                <div className={cn(
                                    "h-8 w-8 flex items-center justify-center transition-colors",
                                    t.isActive ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400"
                                )}>
                                    <LucideSmartphone className="h-4 w-4" />
                                </div>
                                {editingId === t.id ? (
                                    <Input 
                                        autoFocus
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => saveTerminalName(t.id)}
                                        onKeyDown={(e) => e.key === "Enter" && saveTerminalName(t.id)}
                                        className="h-8 font-black uppercase text-[10px] tracking-widest border-blue-200 rounded-none bg-blue-50/30"
                                    />
                                ) : (
                                    <span 
                                        onClick={() => startEditing(t.id, t.name)}
                                        className="font-black uppercase text-[10px] tracking-widest text-slate-700 cursor-pointer hover:text-blue-800 transition-colors"
                                    >
                                        {t.name}
                                    </span>
                                )}
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => toggleTerminalStatusAction(t.id, !t.isActive)}
                                className={cn(
                                    "rounded-none transition-all h-8 w-8",
                                    t.isActive ? "text-blue-800 hover:bg-blue-50" : "text-slate-300 hover:bg-slate-100"
                                )}
                            >
                                <LucidePower className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Sección de Medios de Pago */}
      <div className="space-y-6 flex flex-col">
        <div className="flex items-center gap-3">
            <LucideCreditCard className="h-5 w-5 text-slate-950" />
            <h3 className="font-black uppercase text-sm tracking-widest text-slate-950">Pasarelas & Cobro</h3>
        </div>

        <div className="bg-white border border-slate-200 p-8 space-y-8 flex-1">
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nuevo Canal de Ingreso</label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="NOMBRE (EJ: MERCADO PAGO, TRANSFERENCIA...)" 
                        value={pmName}
                        onChange={(e) => setPmName(e.target.value)}
                        className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-[10px] tracking-widest"
                        onKeyDown={(e) => e.key === "Enter" && handleCreatePM()}
                    />
                    <Button onClick={handleCreatePM} className="bg-slate-950 hover:bg-black text-white rounded-none px-6 h-12 shadow-none">
                        <LucidePlus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Medios de Pago Habilitados</span>
                <div className="divide-y divide-slate-100 border border-slate-100">
                    {initialPaymentMethods.map((pm) => (
                        <div key={pm.id} className={cn(
                            "p-4 flex items-center justify-between transition-all group",
                            pm.isActive ? "bg-white" : "bg-slate-50/50 opacity-60"
                        )}>
                            <div className="flex items-center gap-4 flex-1">
                                <div className={cn(
                                    "h-8 w-8 flex items-center justify-center transition-colors",
                                    pm.isActive ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400"
                                )}>
                                    {pm.type === "cash" ? <LucideBanknote className="h-4 w-4" /> : <LucideCreditCard className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col flex-1">
                                    {editingId === pm.id ? (
                                        <Input 
                                            autoFocus
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => savePMName(pm.id)}
                                            onKeyDown={(e) => e.key === "Enter" && savePMName(pm.id)}
                                            className="h-8 font-black uppercase text-[10px] tracking-widest border-blue-200 rounded-none bg-blue-50/30"
                                        />
                                    ) : (
                                        <span 
                                            onClick={() => startEditing(pm.id, pm.name)}
                                            className="font-black uppercase text-[10px] tracking-widest text-slate-700 cursor-pointer hover:text-blue-800 transition-colors"
                                        >
                                            {pm.name}
                                        </span>
                                    )}
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{pm.type}</span>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => togglePaymentMethodStatusAction(pm.id, !pm.isActive)}
                                className={cn(
                                    "rounded-none transition-all h-8 w-8",
                                    pm.isActive ? "text-blue-800 hover:bg-blue-50" : "text-slate-300 hover:bg-slate-100"
                                )}
                            >
                                <LucidePower className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
