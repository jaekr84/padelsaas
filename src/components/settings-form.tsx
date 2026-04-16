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
import { updateCenterAction, createCenterAction } from "@/lib/actions/center";
import { updateTenantAction } from "@/lib/actions/tenant";
import { useState, useEffect } from "react";
import { LucideSave, LucideCheckCircle2, LucidePlus, LucideBuilding2, LucideBriefcase } from "lucide-react";
import { capitalize } from "@/lib/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const companySchema = z.object({
  id: z.string(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

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
type CompanyValues = z.infer<typeof companySchema>;

export function SettingsForm({ 
  initialCenters, 
  initialTenant 
}: { 
  initialCenters: any[], 
  initialTenant: any 
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [centers, setCenters] = useState(initialCenters);
  const [selectedId, setSelectedId] = useState("empresa");

  const activeCenter = centers.find(c => c.id === selectedId);

  // Form for Centers
  const centerForm = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      id: "",
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      country: "Argentina",
      phone: "",
      whatsapp: "",
      website: "",
      courtsCount: 1,
      openTime: "08:00",
      closeTime: "23:00",
      amenities: {
        hasBar: false,
        hasGrill: false,
        hasLounge: false,
        hasParking: false,
        hasPool: false,
        hasProShop: false,
        hasWiFi: false,
        hasVestuarios: false,
      },
    },
  });

  // Form for Company (Tenant)
  const companyForm = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      id: initialTenant?.id || "",
      name: initialTenant?.name || "",
    },
  });

  // Watch names for reactive tabs
  const watchedCenterName = centerForm.watch("name");
  const watchedCompanyName = companyForm.watch("name");

  // Reset center form when selected center changes
  useEffect(() => {
    if (activeCenter) {
      centerForm.reset({
        id: activeCenter.id,
        name: activeCenter.name,
        description: activeCenter.description || "",
        address: activeCenter.address || "",
        city: activeCenter.city || "",
        state: activeCenter.state || "",
        country: activeCenter.country || "Argentina",
        phone: activeCenter.phone || "",
        whatsapp: activeCenter.whatsapp || "",
        website: activeCenter.website || "",
        courtsCount: activeCenter.courtsCount || 1,
        openTime: activeCenter.openTime || "08:00",
        closeTime: activeCenter.closeTime || "23:00",
        amenities: {
          hasBar: activeCenter.amenities?.hasBar || false,
          hasGrill: activeCenter.amenities?.hasGrill || false,
          hasLounge: activeCenter.amenities?.hasLounge || false,
          hasParking: activeCenter.amenities?.hasParking || false,
          hasPool: activeCenter.amenities?.hasPool || false,
          hasProShop: activeCenter.amenities?.hasProShop || false,
          hasWiFi: activeCenter.amenities?.hasWiFi || false,
          hasVestuarios: activeCenter.amenities?.hasVestuarios || false,
        },
      });
    }
  }, [activeCenter, centerForm]);

  const handleCreateSede = async () => {
    setLoading(true);
    try {
      const name = `Nueva Sede ${centers.length + 1}`;
      const response = await createCenterAction({ name });
      if (response.success && response.center) {
        setCenters([...centers, response.center]);
        setSelectedId(response.center.id);
        toast.success("Nueva sede creada correctamente");
      }
    } catch (error) {
      toast.error("Error al crear sede");
    } finally {
      setLoading(false);
    }
  };

  async function onCompanySubmit(values: CompanyValues) {
    setLoading(true);
    setSuccess(false);
    try {
      const response = await updateTenantAction(values);
      if (response.success) {
        setSuccess(true);
        toast.success("Información de la empresa actualizada");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      toast.error("Error al actualizar la empresa");
    } finally {
      setLoading(false);
    }
  }

  async function onCenterSubmit(values: FormValues) {
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
        // Update local centers list
        setCenters(centers.map(c => c.id === values.id ? { ...c, ...formattedValues } : c));
        toast.success("Configuración guardada", {
          description: "Los datos de la sede han sido actualizados.",
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        toast.error("Error al guardar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Tab Switcher Interface */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4 overflow-x-auto scrollbar-hide">
        {/* Empresa Tab */}
        <button
          onClick={() => setSelectedId("empresa")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap",
            selectedId === "empresa"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <LucideBriefcase className="h-4 w-4" />
          {selectedId === "empresa" ? watchedCompanyName : initialTenant?.name || "Empresa"}
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Center Tabs */}
        {centers.map((center) => (
          <button
            key={center.id}
            onClick={() => setSelectedId(center.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap",
              selectedId === center.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <LucideBuilding2 className="h-4 w-4" />
            {selectedId === center.id ? watchedCenterName : center.name}
          </button>
        ))}
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full gap-2 border-dashed ml-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
          onClick={handleCreateSede}
          disabled={loading}
        >
          <LucidePlus className="h-4 w-4" />
          Nueva Sede
        </Button>
      </div>

      {selectedId === "empresa" ? (
        /* EMPRESA FORM */
        <Form {...companyForm}>
          <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-8">
            <div className="flex items-center justify-between sticky top-20 z-20 bg-background/95 backdrop-blur py-2 border-b">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración del Club</h1>
                <p className="text-muted-foreground">Datos globales de tu organización.</p>
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className={cn(
                  "gap-2 transition-all duration-300",
                  success && "bg-green-600 hover:bg-green-700 text-white border-green-600"
                )}
              >
                {success ? <LucideCheckCircle2 className="h-4 w-4 animate-in zoom-in" /> : <LucideSave className="h-4 w-4" />}
                {loading ? "Guardando..." : success ? "¡Guardado con éxito!" : "Guardar Cambios Empresa"}
              </Button>
            </div>

            <Card className="border-none shadow-md max-w-2xl">
              <CardHeader>
                <CardTitle>Información Institucional</CardTitle>
                <CardDescription>Estos datos se usan para la marca general del club.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Club / Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Padel Master Club" {...field} />
                      </FormControl>
                      <FormDescription>Nombre que aparecerá en listados y apps de jugadores.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>
      ) : (
        /* CENTER FORM */
        <Form {...centerForm}>
          <form onSubmit={centerForm.handleSubmit(onCenterSubmit)} className="space-y-8">
            <div className="flex items-center justify-between sticky top-20 z-20 bg-background/95 backdrop-blur py-2 border-b">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {selectedId === activeCenter?.id ? watchedCenterName : activeCenter?.name}
                </h1>
                <p className="text-muted-foreground">Administra los detalles exclusivos de esta ubicación.</p>
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
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
                  control={centerForm.control}
                  name="name"
                  render={({ field }) => (
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
                  control={centerForm.control}
                  name="courtsCount"
                  render={({ field }) => (
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
                control={centerForm.control}
                name="description"
                render={({ field }) => (
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
                  control={centerForm.control}
                  name="openTime"
                  render={({ field }) => (
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
                  control={centerForm.control}
                  name="closeTime"
                  render={({ field }) => (
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
                control={centerForm.control}
                name="address"
                render={({ field }) => (
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
                  control={centerForm.control}
                  name="city"
                  render={({ field }) => (
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
                  control={centerForm.control}
                  name="state"
                  render={({ field }) => (
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
                control={centerForm.control}
                name="country"
                render={({ field }) => (
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
                  control={centerForm.control}
                  name="phone"
                  render={({ field }) => (
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
                  control={centerForm.control}
                  name="whatsapp"
                  render={({ field }) => (
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
                control={centerForm.control}
                name="website"
                render={({ field }) => (
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
                    control={centerForm.control}
                    name={item.name as any}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mr-2">
                        <FormLabel className="text-base cursor-pointer">
                          {item.label}
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value as boolean}
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
    )}
  </div>
  );
}
