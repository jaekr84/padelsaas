"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { type ControllerRenderProps } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { updateCenterAction } from "@/lib/actions/center";
import { useState } from "react";
import { LucideSave, LucideCheckCircle2 } from "lucide-react";
import { capitalize } from "@/lib/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string(),
  address: z.string().min(5, "La dirección es obligatoria"),
  city: z.string().min(2, "La localidad es obligatoria"),
  state: z.string().min(2, "La provincia es obligatoria"),
  country: z.string().min(2, "El país es obligatorio"),
  phone: z.string(),
  whatsapp: z.string(),
  website: z.string(),
  amenities: z.object({
    hasBar: z.boolean(),
    hasGrill: z.boolean(),
    hasLounge: z.boolean(),
    hasParking: z.boolean(),
    hasPool: z.boolean(),
    hasProShop: z.boolean(),
    hasWiFi: z.boolean(),
    hasVestuarios: z.boolean(),
  }),
  courtsCount: z.coerce.number().min(1, "Debe tener al menos 1 cancha"),
  openTime: z.string(),
  closeTime: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      country: initialData?.country || "Argentina",
      phone: initialData?.phone || "",
      whatsapp: initialData?.whatsapp || "",
      website: initialData?.website || "",
      courtsCount: initialData?.courtsCount || 1,
      openTime: initialData?.openTime || "08:00",
      closeTime: initialData?.closeTime || "23:00",
      amenities: {
        hasBar: initialData?.amenities?.hasBar || false,
        hasGrill: initialData?.amenities?.hasGrill || false,
        hasLounge: initialData?.amenities?.hasLounge || false,
        hasParking: initialData?.amenities?.hasParking || false,
        hasPool: initialData?.amenities?.hasPool || false,
        hasProShop: initialData?.amenities?.hasProShop || false,
        hasWiFi: initialData?.amenities?.hasWiFi || false,
        hasVestuarios: initialData?.amenities?.hasVestuarios || false,
      },
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setSuccess(false);
    try {
      // Apply capitalization preferences
      const formattedValues = {
        ...values,
        name: capitalize(values.name),
        address: capitalize(values.address),
        city: capitalize(values.city),
        state: capitalize(values.state),
      };
      const response = await updateCenterAction(formattedValues);
      
      if (response.success) {
        setSuccess(true);
        form.reset(values); // Re-initialize form with saved values
        toast.success("Configuración guardada", {
          description: "Los datos de tu centro han sido actualizados con éxito.",
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        toast.error("Error al guardar", {
          description: "No se pudieron guardar los cambios. Intenta nuevamente.",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión", {
        description: "Hubo un problema al comunicarse con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-8 pb-10">
        <div className="flex items-center justify-between sticky top-20 z-20 bg-background/95 backdrop-blur py-2 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración del Centro</h1>
            <p className="text-muted-foreground">Administra la información pública y servicios de tu club.</p>
          </div>
          <Button 
            type="submit" 
            disabled={loading} 
            variant={success ? "default" : "default"}
            className={cn(
              "gap-2 transition-all duration-300",
              success && "bg-green-600 hover:bg-green-700 text-white border-green-600"
            )}
          >
            {success ? <LucideCheckCircle2 className="h-4 w-4 animate-in zoom-in" /> : <LucideSave className="h-4 w-4" />}
            {loading ? "Guardando..." : success ? "¡Guardado con éxito!" : "Guardar Cambios"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Información General */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos principales de identificación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Nombre del Centro</FormLabel>
                      <FormControl>
                        <Input placeholder="Padel Center Pro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="courtsCount"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Cantidad de Canchas</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} placeholder="4" {...field} />
                      </FormControl>
                      <FormDescription>Número total de canchas disponibles.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Contanos sobre tu centro..." 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Breve resumen que verán los usuarios.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Horarios de Operación */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Horarios de Operación</CardTitle>
              <CardDescription>Definí el rango horario en que el club está abierto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="openTime"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Apertura</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="08:00" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 48 }).map((_, i) => {
                            const h = Math.floor(i / 2).toString().padStart(2, "0");
                            const m = i % 2 === 0 ? "00" : "30";
                            const time = `${h}:${m}`;
                            return (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="closeTime"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Cierre</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="23:00" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 48 }).map((_, i) => {
                            const h = Math.floor(i / 2).toString().padStart(2, "0");
                            const m = i % 2 === 0 ? "00" : "30";
                            const time = `${h}:${m}`;
                            return (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                Estos horarios ajustarán la visualización de la grilla de turnos en las canchas.
              </FormDescription>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
              <CardDescription>¿Dónde se encuentra tu club?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. Siempre Viva 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Localidad</FormLabel>
                      <FormControl>
                        <Input placeholder="CABA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input placeholder="Buenos Aires" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="country"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Argentina">Argentina</SelectItem>
                        <SelectItem value="Uruguay">Uruguay</SelectItem>
                        <SelectItem value="Chile">Chile</SelectItem>
                        <SelectItem value="España">España</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Contacto & Redes</CardTitle>
              <CardDescription>Cómo pueden contactarte los jugadores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Teléfono Fijo</FormLabel>
                      <FormControl>
                        <Input placeholder="+54 11 ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="11 ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="website"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Sitio Web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Servicios & Comodidades</CardTitle>
              <CardDescription>Marcá los servicios que ofrece tu centro.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4">
                {[
                  { name: "amenities.hasBar", label: "Bar / Cafetería" },
                  { name: "amenities.hasGrill", label: "Parrilla" },
                  { name: "amenities.hasLounge", label: "Lounge / Coworking" },
                  { name: "amenities.hasParking", label: "Estacionamiento" },
                  { name: "amenities.hasWiFi", label: "WiFi Gratis" },
                  { name: "amenities.hasVestuarios", label: "Vestuarios" },
                  { name: "amenities.hasProShop", label: "Pro Shop" },
                  { name: "amenities.hasPool", label: "Pileta" },
                ].map((item) => (
                  <FormField
                    key={item.name}
                    control={form.control}
                    name={item.name as any}
                    render={({ field }: any) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mr-2">
                        <FormLabel className="text-base cursor-pointer">
                          {item.label}
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
