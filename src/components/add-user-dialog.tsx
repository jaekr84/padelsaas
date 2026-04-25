"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserAction } from "@/lib/actions/user";
import { getCentersAction } from "@/lib/actions/center";
import { LucideUserPlus, LucideLoader2, LucideCheckCircle2, LucideShieldAlert, LucideKey } from "lucide-react";
import { capitalize } from "@/lib/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "mostrador"]),
  centerId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "mostrador",
      centerId: "",
    },
  });

  useEffect(() => {
    async function fetchCenters() {
      try {
        const data = await getCentersAction();
        setCenters(data);
        if (data.length > 0) {
          form.setValue("centerId", data[0].id);
        }
      } catch (error) {
        console.error("Error fetching centers:", error);
      }
    }
    if (open) {
      fetchCenters();
    }
  }, [open, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        name: capitalize(values.name),
      };
      await createUserAction(formattedValues);
      setSuccess(true);
      toast.success("ALTA EXITOSA", {
        description: `SE HA GENERADO EL ACCESO PARA ${formattedValues.name.toUpperCase()}.`,
      });
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        form.reset();
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "ERROR EN REGISTRO");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="h-12 bg-slate-950 hover:bg-black text-white rounded-none font-black uppercase tracking-[0.2em] text-[10px] px-8 transition-all gap-3 shadow-none border-none">
          <LucideUserPlus className="h-4 w-4" />
          Registrar Personal
        </Button>
      } />
      <DialogContent className="sm:max-w-[450px] rounded-none border-slate-200 p-0 overflow-hidden">
        <DialogHeader className="bg-slate-950 text-white p-8 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-4 bg-blue-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Security / Identity</span>
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter">Alta de Usuario</DialogTitle>
          <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Asignación de credenciales operativas y niveles de acceso al sistema.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v: any) => onSubmit(v))} className="p-8 space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 flex items-start gap-3 mb-2">
              <LucideKey className="h-4 w-4 text-blue-800 mt-0.5" />
              <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest leading-normal">
                AVISO: LA CONTRASEÑA TEMPORAL PARA NUEVOS USUARIOS ES <span className="underline font-black">"PASS123"</span>. EL USUARIO DEBERÁ ACTUALIZARLA EN SU PRIMER INGRESO.
              </p>
            </div>

            <FormField<FormValues>
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="EJ: JUAN PÉREZ" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />
            
            <FormField<FormValues>
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Correo Electrónico (Login)</FormLabel>
                  <FormControl>
                    <Input placeholder="USUARIO@EMPRESA.COM" type="email" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField<FormValues>
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nivel de Privilegio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-none font-black text-[10px] uppercase tracking-widest focus:ring-0 focus:border-blue-800">
                          <SelectValue placeholder="ROL" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-slate-200">
                        <SelectItem value="admin" className="text-[10px] font-black uppercase tracking-widest">Administrador</SelectItem>
                        <SelectItem value="mostrador" className="text-[10px] font-black uppercase tracking-widest">Operador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              
              <FormField<FormValues>
                control={form.control}
                name="centerId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sede Asignada</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-none font-black text-[10px] uppercase tracking-widest focus:ring-0 focus:border-blue-800">
                          <SelectValue placeholder="SEDE" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-slate-200">
                        {centers.map((center) => (
                          <SelectItem key={center.id} value={center.id} className="text-[10px] font-black uppercase tracking-widest">
                            {center.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-6 border-t border-slate-100">
              <Button
                type="submit"
                disabled={loading || success}
                className={cn(
                  "w-full h-14 rounded-none font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 shadow-none border-none",
                  success ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-800 hover:bg-blue-900 text-white"
                )}
              >
                {loading ? (
                  <LucideLoader2 className="h-5 w-5 animate-spin" />
                ) : success ? (
                  <LucideCheckCircle2 className="h-5 w-5 animate-in zoom-in" />
                ) : (
                  <LucideUserPlus className="h-5 w-5 mr-2" />
                )}
                {loading ? "PROCESANDO..." : success ? "REGISTRO COMPLETADO" : "CONFIRMAR ALTA"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
