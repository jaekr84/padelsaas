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
import { LucideUserPlus, LucideLoader2, LucideCheckCircle2 } from "lucide-react";
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
      toast.success("Usuario registrado con éxito", {
        description: `Se ha creado el acceso para ${formattedValues.name}.`,
      });
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        form.reset();
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="gap-2">
          <LucideUserPlus className="h-4 w-4" />
          Registrar Personal
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Usuario</DialogTitle>
          <DialogDescription>
            Crea una cuenta para un empleado de tu centro. La contraseña por defecto será "pass123".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v: any) => onSubmit(v))} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="juan@ejemplo.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador (Total)</SelectItem>
                      <SelectItem value="mostrador">Mostrador (Limitado)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Determina qué secciones podrá ver el usuario.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="centerId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Sede Asignada</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sede" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {centers.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    La sede donde trabajará principalmente este usuario.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="submit"
                disabled={loading || success}
                className={cn(
                  "w-full gap-2 transition-all duration-300",
                  success && "bg-green-600 hover:bg-green-700 text-white border-green-600"
                )}
              >
                {loading ? (
                  <LucideLoader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                  <LucideCheckCircle2 className="h-4 w-4 animate-in zoom-in" />
                ) : (
                  null
                )}
                {loading ? "Registrando..." : success ? "¡Registrado!" : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
