"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LucideUserPlus, 
  LucideUser, 
  LucidePhone, 
  LucideMail, 
  LucideFingerprint, 
  LucideCalendar,
  LucideTrophy,
  LucideTag,
  LucideFileText,
  LucideShieldCheck,
  LucideX
} from "lucide-react";
import { createCustomerAction } from "@/lib/actions/customer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CreateCustomerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dni: formData.get("dni") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      birthDate: formData.get("birthDate") ? new Date(formData.get("birthDate") as string) : undefined,
      padelLevel: formData.get("padelLevel") as string,
      category: formData.get("category") as string,
      notes: formData.get("notes") as string,
    };

    try {
      const result = await createCustomerAction(data);
      if (result.success) {
        toast.success("Cliente creado correctamente");
        setIsOpen(false);
      } else {
        toast.error(result.error || "Error al crear cliente");
      }
    } catch (error) {
      toast.error("Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button className="bg-blue-800 hover:bg-blue-900 text-white rounded-none shadow-none transition-all font-black uppercase text-[10px] tracking-[0.2em] gap-3 h-12 px-8">
          <LucideUserPlus className="w-4 h-4" />
          Alta de Cliente
        </Button>
      } />
      <DialogContent className="sm:max-w-[650px] rounded-none border border-slate-200 shadow-2xl p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="bg-slate-950 p-8 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-4 bg-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Sistema CRM</span>
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">
                Registro de Entidad
            </DialogTitle>
          </div>
          <div className="h-12 w-12 bg-white/5 border border-white/10 flex items-center justify-center text-blue-500">
             <LucideShieldCheck className="h-6 w-6" />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {/* Nombre */}
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nombre de Pila</Label>
              <div className="relative">
                <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input name="firstName" required className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" placeholder="NOMBRE" />
              </div>
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Apellido del Cliente</Label>
              <div className="relative">
                <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input name="lastName" required className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" placeholder="APELLIDO" />
              </div>
            </div>

            {/* DNI */}
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">DNI / Documentación</Label>
              <div className="relative">
                <LucideFingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input name="dni" className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold tabular-nums" placeholder="00.000.000" />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Teléfono de Contacto</Label>
              <div className="relative">
                <LucidePhone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input name="phone" className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold tabular-nums" placeholder="+54 9..." />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2 col-span-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Correo Electrónico (Notificaciones)</Label>
              <div className="relative">
                <LucideMail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input name="email" type="email" className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold lowercase" placeholder="usuario@dominio.com" />
              </div>
            </div>

            {/* Fecha Nacimiento */}
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fecha de Nacimiento</Label>
              <div className="relative">
                <LucideCalendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input name="birthDate" type="date" className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold" />
              </div>
            </div>

            {/* Nivel de Padel */}
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nivel Operativo (Pádel)</Label>
              <div className="relative">
                <LucideTrophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input name="padelLevel" className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" placeholder="CATEGORÍA" />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-2 col-span-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Categorización CRM</Label>
              <div className="relative">
                <LucideTag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input name="category" className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" defaultValue="FRECUENTE" />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2 col-span-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Observaciones Técnicas</Label>
              <div className="relative">
                <LucideFileText className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                <textarea 
                  name="notes" 
                  rows={3}
                  className="w-full pl-12 p-4 bg-slate-50 border border-slate-200 rounded-none focus:border-blue-800 transition-all font-bold outline-none text-xs uppercase" 
                  placeholder="DETALLES ADICIONALES..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="rounded-none font-black uppercase text-[10px] tracking-widest border-slate-200 h-12 px-8 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-800 hover:bg-blue-900 text-white rounded-none px-10 h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-none"
            >
              {isLoading ? "Procesando..." : "Confirmar Alta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
