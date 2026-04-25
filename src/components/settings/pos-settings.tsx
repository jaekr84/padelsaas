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
  LucideSettings2
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
      toast.success("Terminal creada");
      setTerminalName("");
    } else {
      toast.error(res.error);
    }
  };

  const handleCreatePM = async () => {
    if (!pmName.trim()) return;
    const res = await createPaymentMethodAction({ name: pmName, type: "other" });
    if (res.success) {
      toast.success("Medio de pago creado");
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
      toast.success("Nombre actualizado");
    } else {
      toast.error(res.error);
    }
    setEditingId(null);
  };

  const savePMName = async (id: string) => {
    if (!editValue.trim()) return setEditingId(null);
    const res = await updatePaymentMethodNameAction(id, editValue);
    if (res.success) {
      toast.success("Nombre actualizado");
    } else {
      toast.error(res.error);
    }
    setEditingId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sección de Terminales */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <LucideLaptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm tracking-tight text-slate-900">Terminales / Cajas</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Puntos de venta habilitados</p>
            </div>
          </div>

          <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
            <Input 
              placeholder="NOMBRE (EJ: CAJA 1, MÓVIL...)" 
              value={terminalName}
              onChange={(e) => setTerminalName(e.target.value)}
              className="border-none bg-transparent focus-visible:ring-0 font-bold uppercase text-[11px] tracking-widest"
              onKeyDown={(e) => e.key === "Enter" && handleCreateTerminal()}
            />
            <Button onClick={handleCreateTerminal} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4">
              <LucidePlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-3">
          {initialTerminals.map((t) => (
            <div key={t.id} className={cn(
              "p-4 rounded-2xl border flex items-center justify-between transition-all group",
              t.isActive ? "bg-white border-slate-100" : "bg-slate-50 border-slate-50 opacity-60"
            )}>
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                  t.isActive ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-400"
                )}>
                  <LucideSmartphone className="h-5 w-5" />
                </div>
                {editingId === t.id ? (
                  <Input 
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveTerminalName(t.id)}
                    onKeyDown={(e) => e.key === "Enter" && saveTerminalName(t.id)}
                    className="h-8 font-black uppercase text-[11px] tracking-widest border-indigo-200"
                  />
                ) : (
                  <span 
                    onClick={() => startEditing(t.id, t.name)}
                    className="font-black uppercase text-[11px] tracking-widest text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors"
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
                  "rounded-xl transition-all",
                  t.isActive ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-300 hover:bg-slate-100"
                )}
              >
                <LucidePower className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Sección de Medios de Pago */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <LucideCreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm tracking-tight text-slate-900">Medios de Pago</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Formas de cobro aceptadas</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
              <Input 
                placeholder="NOMBRE (EJ: MERCADO PAGO...)" 
                value={pmName}
                onChange={(e) => setPmName(e.target.value)}
                className="border-none bg-transparent focus-visible:ring-0 font-bold uppercase text-[11px] tracking-widest"
                onKeyDown={(e) => e.key === "Enter" && handleCreatePM()}
              />
              <Button onClick={handleCreatePM} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4">
                <LucidePlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-3">
          {initialPaymentMethods.map((pm) => (
            <div key={pm.id} className={cn(
              "p-4 rounded-2xl border flex items-center justify-between transition-all group",
              pm.isActive ? "bg-white border-slate-100" : "bg-slate-50 border-slate-50 opacity-60"
            )}>
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                  pm.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-400"
                )}>
                  {pm.type === "cash" ? <LucideBanknote className="h-5 w-5" /> : <LucideCreditCard className="h-5 w-5" />}
                </div>
                <div className="flex flex-col flex-1">
                  {editingId === pm.id ? (
                    <Input 
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => savePMName(pm.id)}
                      onKeyDown={(e) => e.key === "Enter" && savePMName(pm.id)}
                      className="h-8 font-black uppercase text-[11px] tracking-widest border-emerald-200"
                    />
                  ) : (
                    <span 
                      onClick={() => startEditing(pm.id, pm.name)}
                      className="font-black uppercase text-[11px] tracking-widest text-slate-700 cursor-pointer hover:text-emerald-600 transition-colors"
                    >
                      {pm.name}
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{pm.type}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => togglePaymentMethodStatusAction(pm.id, !pm.isActive)}
                className={cn(
                  "rounded-xl transition-all",
                  pm.isActive ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-300 hover:bg-slate-100"
                )}
              >
                <LucidePower className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
