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
import { updateUserPasswordAction } from "@/lib/actions/user";
import { useState } from "react";
import { LucideShieldCheck, LucideCheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export function PasswordForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setSuccess(false);
    try {
      const response = await updateUserPasswordAction(values.password);

      if (response.success) {
        setSuccess(true);
        toast.success("Contraseña actualizada", {
          description: "Tu seguridad ha sido reforzada.",
        });
        form.reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex-1 border-none shadow-sm bg-card/40 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-8 pt-8 px-8 min-h-[160px] flex flex-col justify-center">
        <CardTitle className="text-2xl font-bold">Seguridad</CardTitle>
        <CardDescription className="text-base italic mt-2">Actualiza tu contraseña de acceso.</CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input placeholder="******" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <Input placeholder="******" type="password" {...field} />
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
                {success ? <LucideCheckCircle2 className="h-4 w-4 animate-in zoom-in" /> : <LucideShieldCheck className="h-4 w-4" />}
                {loading ? "Actualizando..." : success ? "¡Seguridad reforzada!" : "Actualizar contraseña"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
