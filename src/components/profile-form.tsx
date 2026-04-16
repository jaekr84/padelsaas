"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { updateUserProfileAction } from "@/lib/actions/user";
import { useState } from "react";
import { LucideSave, LucideCheckCircle2 } from "lucide-react";
import { capitalize } from "@/lib/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setSuccess(false);
    try {
      const formattedValues = {
        ...values,
        name: capitalize(values.name),
      };
      const response = await updateUserProfileAction(formattedValues);
      
      if (response.success) {
        setSuccess(true);
        toast.success("Perfil actualizado", {
          description: "Tus datos personales han sido guardados.",
        });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar perfil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex-1 border-none shadow-sm bg-card/40 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-8 pt-8 px-8 min-h-[160px] flex flex-col justify-center">
        <CardTitle className="text-2xl font-bold">Información Personal</CardTitle>
        <CardDescription className="text-base italic mt-2">Actualiza tu nombre y correo electrónico.</CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
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
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@email.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className={cn(
                  "w-full gap-2 transition-all duration-300",
                  success && "bg-green-600 hover:bg-green-700 text-white border-green-600"
                )}
              >
                {success ? <LucideCheckCircle2 className="h-4 w-4 animate-in zoom-in" /> : <LucideSave className="h-4 w-4" />}
                {loading ? "Guardando..." : success ? "¡Perfil actualizado!" : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
