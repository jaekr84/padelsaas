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
  LucideFileText
} from "lucide-react";
import { createCustomerAction } from "@/lib/actions/customer";
import { toast } from "sonner";

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
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 transition-all font-black uppercase text-[10px] tracking-widest gap-2 h-12 px-6">
          <LucideUserPlus className="w-5 h-5" />
          Nuevo Cliente
        </Button>
      } />
      <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <LucideUserPlus className="h-6 w-6" />
            </div>
            Registrar Cliente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
              <div className="relative group">
                <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input name="firstName" required className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all font-bold" placeholder="EJ: JUAN" />
              </div>
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</Label>
              <div className="relative group">
                <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input name="lastName" required className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all font-bold" placeholder="EJ: PEREZ" />
              </div>
            </div>

            {/* DNI */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">DNI / Documento</Label>
              <div className="relative group">
                <LucideFingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input name="dni" className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all font-bold" placeholder="12.345.678" />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono</Label>
              <div className="relative group">
                <LucidePhone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input name="phone" className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all font-bold" placeholder="+54 9..." />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
              <div className="relative group">
                <LucideMail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input name="email" type="email" className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all font-bold" placeholder="juan.perez@email.com" />
              </div>
            </div>

            {/* Fecha Nacimiento */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fecha de Nacimiento</Label>
              <div className="relative group">
                <LucideCalendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input name="birthDate" type="date" className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all font-bold" />
              </div>
            </div>

            {/* Nivel de Padel */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nivel de Juego</Label>
              <div className="relative group">
                <LucideTrophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input name="padelLevel" className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all font-bold" placeholder="EJ: 5ta" />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoría CRM</Label>
              <div className="relative group">
                <LucideTag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input name="category" className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all font-bold" defaultValue="Frecuente" />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notas / Observaciones</Label>
              <div className="relative group">
                <LucideFileText className="absolute left-4 top-4 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <textarea 
                  name="notes" 
                  rows={3}
                  className="w-full pl-11 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition-all font-bold outline-none text-sm" 
                  placeholder="Detalles adicionales..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
            >
              {isLoading ? "Registrando..." : "Guardar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
