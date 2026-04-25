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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import {
  LucideSave,
  LucideCheckCircle2,
  LucidePlus,
  LucideBuilding2,
  LucideBriefcase,
  LucideTrash2,
  LucideZap,
  LucideScanBarcode,
  LucideShieldCheck,
  LucideChevronRight,
  LucideSettings2,
  LucideMapPin,
  LucidePhone,
  LucideGlobe,
  LucideCoffee
} from "lucide-react";
import { capitalize } from "@/lib/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updatePricingConfigAction } from "@/lib/actions/pricing";
import { PricingCanvas } from "./pricing-canvas";
import { POSSettings } from "./settings/pos-settings";

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
  defaultPrice30: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;
type CompanyValues = z.infer<typeof companySchema>;

export function SettingsForm({
  initialCenters,
  initialTenant,
  initialTerminals,
  initialPaymentMethods
}: {
  initialCenters: any[],
  initialTenant: any,
  initialTerminals: any[],
  initialPaymentMethods: any[]
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
      defaultPrice30: 0,
    },
  });

  const [schedules, setSchedules] = useState<any[]>([]);

  // Form for Company (Tenant)
  const companyForm = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      id: initialTenant?.id || "",
      name: initialTenant?.name || "",
    },
  });

  const watchedCenterName = centerForm.watch("name");
  const watchedCompanyName = companyForm.watch("name");
  const watchBasePrice = centerForm.watch("defaultPrice30");
  const watchOpenTime = centerForm.watch("openTime");
  const watchCloseTime = centerForm.watch("closeTime");

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
        defaultPrice30: activeCenter.defaultPrice30 || 0,
      });
      setSchedules(activeCenter.pricingSchedules || []);
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
        toast.success("Configuración institucional actualizada");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  }

  async function onCenterSubmit(values: FormValues) {
    setLoading(true);
    setSuccess(false);
    try {
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
        setCenters(centers.map(c => c.id === values.id ? { ...c, ...formattedValues } : c));
        toast.success("Configuración de sede guardada");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function onPricingSubmit() {
    if (!activeCenter) return;
    setLoading(true);
    try {
      const response = await updatePricingConfigAction(activeCenter.id, {
        defaultPrice30: centerForm.getValues("defaultPrice30"),
        schedules: schedules
      });
      if (response.success) {
        toast.success("Matriz de tarifas actualizada");
        setCenters(centers.map(c => c.id === activeCenter.id ? {
          ...c,
          defaultPrice30: centerForm.getValues("defaultPrice30"),
          pricingSchedules: schedules
        } : c));
      }
    } catch (error) {
      toast.error("Error al actualizar tarifas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* 1. Selector de Entorno (Technical Tabs) */}
      <div className="flex flex-col gap-4">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 px-1">Control de Entorno</span>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSelectedId("empresa")}
            className={cn(
              "h-12 px-6 flex items-center gap-3 border transition-all rounded-none font-black uppercase text-[10px] tracking-widest",
              selectedId === "empresa"
                ? "bg-slate-950 text-white border-slate-950 shadow-lg"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            )}
          >
            <LucideBriefcase className="h-4 w-4" />
            {selectedId === "empresa" ? watchedCompanyName : initialTenant?.name || "INSTITUCIÓN"}
          </button>

          <button
            onClick={() => setSelectedId("tpv")}
            className={cn(
              "h-12 px-6 flex items-center gap-3 border transition-all rounded-none font-black uppercase text-[10px] tracking-widest",
              selectedId === "tpv"
                ? "bg-slate-950 text-white border-slate-950 shadow-lg"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            )}
          >
            <LucideScanBarcode className="h-4 w-4" />
            TPV / CAJAS
          </button>

          <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block" />

          {centers.map((center) => (
            <button
              key={center.id}
              onClick={() => setSelectedId(center.id)}
              className={cn(
                "h-12 px-6 flex items-center gap-3 border transition-all rounded-none font-black uppercase text-[10px] tracking-widest",
                selectedId === center.id
                  ? "bg-blue-800 text-white border-blue-800 shadow-lg"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              )}
            >
              <LucideBuilding2 className="h-4 w-4" />
              {selectedId === center.id ? watchedCenterName : center.name}
            </button>
          ))}

          <Button
            variant="outline"
            onClick={handleCreateSede}
            disabled={loading}
            className="h-12 px-6 rounded-none border-dashed border-slate-300 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 gap-2"
          >
            <LucidePlus className="h-4 w-4" />
            Nueva Sede
          </Button>
        </div>
      </div>

      {selectedId === "empresa" ? (
        /* EMPRESA FORM */
        <Form {...companyForm}>
          <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-10">
            <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6 border-b border-slate-200 pb-8 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-30 pt-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-6 bg-slate-950" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-950">Perfil Organizacional</span>
                </div>
                <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">Configuración Global</h1>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 bg-slate-950 hover:bg-black text-white rounded-none font-black uppercase tracking-[0.2em] text-[10px] px-10 transition-all gap-3 shadow-none"
              >
                {loading ? "Sincronizando..." : success ? <LucideCheckCircle2 className="h-4 w-4" /> : <LucideSave className="h-4 w-4" />}
                Guardar Perfil
              </Button>
            </div>

            <div className="grid gap-10 max-w-4xl">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <LucideSettings2 className="h-5 w-5 text-slate-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">Datos Institucionales</h2>
                </div>
                <div className="bg-white border border-slate-200 p-8 space-y-8">
                  <FormField
                    control={companyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre de la Organización</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="EJ: PADEL MASTER CLUB S.A."
                            {...field}
                            className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs"
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] font-medium text-slate-400 italic">Identificación oficial utilizada en comprobantes y comunicaciones del sistema.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </Form>
      ) : selectedId === "tpv" ? (
        /* TPV / POS SETTINGS */
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-6 bg-slate-950" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-950">Estructura Financiera</span>
              </div>
              <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">TPV & Cobranzas</h1>
            </div>
          </div>
          <POSSettings
            initialTerminals={initialTerminals}
            initialPaymentMethods={initialPaymentMethods}
          />
        </div>
      ) : (
        /* CENTER FORM */
        <Form {...centerForm}>
          <form onSubmit={centerForm.handleSubmit(onCenterSubmit)} className="space-y-16">
            <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6 border-b border-slate-200 pb-8 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-30 pt-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-6 bg-blue-800" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-800">Parámetros de Sede</span>
                </div>
                <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">
                  {selectedId === activeCenter?.id ? watchedCenterName : activeCenter?.name}
                </h1>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 bg-blue-800 hover:bg-blue-900 text-white rounded-none font-black uppercase tracking-[0.2em] text-[10px] px-10 transition-all gap-3 shadow-none"
              >
                {loading ? "Actualizando..." : success ? <LucideCheckCircle2 className="h-4 w-4" /> : <LucideSave className="h-4 w-4" />}
                Guardar Sede
              </Button>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              {/* 1. Identificación */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <LucideBuilding2 className="h-5 w-5 text-blue-800" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">Identificación</h2>
                </div>
                <div className="bg-white border border-slate-200 p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={centerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Denominación</FormLabel>
                          <FormControl>
                            <Input placeholder="NOMBRE DE SEDE" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={centerForm.control}
                      name="courtsCount"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Capacidad (Canchas)</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-black text-xs tabular-nums" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={centerForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Descripción Pública</FormLabel>
                        <FormControl>
                          <Textarea placeholder="BREVE RESUMEN PARA USUARIOS..." className="bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-[10px] resize-none h-24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 2. Ubicación */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <LucideMapPin className="h-5 w-5 text-blue-800" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">Ubicación Técnica</h2>
                </div>
                <div className="bg-white border border-slate-200 p-8 space-y-6">
                  <FormField
                    control={centerForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Domicilio Legal / Operativo</FormLabel>
                        <FormControl>
                          <Input placeholder="DIRECCIÓN COMPLETA" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={centerForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Localidad</FormLabel>
                          <FormControl>
                            <Input placeholder="CIUDAD" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={centerForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Provincia</FormLabel>
                          <FormControl>
                            <Input placeholder="ESTADO" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Operación */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <LucideZap className="h-5 w-5 text-blue-800" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">Ventana Operativa</h2>
                </div>
                <div className="bg-white border border-slate-200 p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={centerForm.control}
                      name="openTime"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Apertura</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-none font-black text-xs tabular-nums focus:ring-0 focus:border-blue-800">
                                <SelectValue placeholder="00:00" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none border-slate-200">
                              {Array.from({ length: 48 }).map((_, i) => {
                                const h = Math.floor(i / 2).toString().padStart(2, "0");
                                const m = i % 2 === 0 ? "00" : "30";
                                const time = `${h}:${m}`;
                                return <SelectItem key={time} value={time} className="text-[11px] font-black tabular-nums">{time}</SelectItem>;
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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cierre</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-none font-black text-xs tabular-nums focus:ring-0 focus:border-blue-800">
                                <SelectValue placeholder="00:00" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-none border-slate-200">
                              {Array.from({ length: 48 }).map((_, i) => {
                                const h = Math.floor(i / 2).toString().padStart(2, "0");
                                const m = i % 2 === 0 ? "00" : "30";
                                const time = `${h}:${m}`;
                                return <SelectItem key={time} value={time} className="text-[11px] font-black tabular-nums">{time}</SelectItem>;
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic text-center">Este rango define la disponibilidad visible en la grilla de turnos.</p>
                </div>
              </div>

              {/* 4. Contacto */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <LucidePhone className="h-5 w-5 text-blue-800" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">Canales de Contacto</h2>
                </div>
                <div className="bg-white border border-slate-200 p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={centerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tel. Fijo</FormLabel>
                          <FormControl>
                            <Input placeholder="+54..." {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={centerForm.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="11..." {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold text-xs" />
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
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-500">Página Web / Linktree</FormLabel>
                        <FormControl>
                          <Input placeholder="HTTPS://..." {...field} className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold text-xs" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 5. Servicios (Amenities) */}
              <div className="space-y-6 lg:col-span-2">
                <div className="flex items-center gap-3">
                  <LucideCoffee className="h-5 w-5 text-blue-800" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">Servicios & Infraestructura</h2>
                </div>
                <div className="bg-white border border-slate-200 p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "amenities.hasBar", label: "Bar / Café" },
                      { name: "amenities.hasGrill", label: "Parrilla" },
                      { name: "amenities.hasLounge", label: "Lounge" },
                      { name: "amenities.hasParking", label: "Parking" },
                      { name: "amenities.hasWiFi", label: "WiFi" },
                      { name: "amenities.hasVestuarios", label: "Vestuarios" },
                      { name: "amenities.hasProShop", label: "Shop" },
                      { name: "amenities.hasPool", label: "Pileta" },
                    ].map((item) => (
                      <FormField
                        key={item.name}
                        control={centerForm.control}
                        name={item.name as any}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between border border-slate-100 p-4 bg-slate-50/30">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-700 cursor-pointer">{item.label}</FormLabel>
                            <FormControl>
                              <Switch checked={field.value as boolean} onCheckedChange={field.onChange} className="data-[state=checked]:bg-blue-800 scale-90" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Tarifas (Technical Matrix) */}
            <div className="space-y-10 pt-10 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-4 bg-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">Motor de Precios</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-950">Matriz de Tarifas</h2>
                </div>
                <Button type="button" onClick={onPricingSubmit} disabled={loading} className="h-12 bg-emerald-700 hover:bg-emerald-800 text-white rounded-none font-black uppercase tracking-[0.2em] text-[10px] px-8 gap-3">
                  <LucideSave className="h-4 w-4" /> Guardar Tarifas
                </Button>
              </div>

              <div className="grid gap-10 lg:grid-cols-4">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-emerald-50 border border-emerald-200 p-8 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-emerald-800">Costo Base (30 min)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-700 text-sm">$</span>
                        <Input type="number" value={watchBasePrice} onChange={(e) => centerForm.setValue("defaultPrice30", Number(e.target.value))} className="pl-10 h-14 bg-white border-emerald-300 rounded-none focus:ring-0 font-black text-lg text-emerald-900 tabular-nums" />
                      </div>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-relaxed mt-4">Este valor se aplica por defecto en todas las franjas horarias no especificadas en la grilla.</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="bg-white border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-950">Visualización de Franjas Semanales</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-emerald-500" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sincronización Activa</span>
                      </div>
                    </div>
                    <div className="p-0">
                      <PricingCanvas
                        rules={schedules}
                        basePrice={Number(watchBasePrice) || 0}
                        onChange={(newRules) => setSchedules(newRules)}
                        openTime={watchOpenTime}
                        closeTime={watchCloseTime}
                      />
                    </div>
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center gap-3">
                      <LucideZap className="h-4 w-4 text-amber-500" />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Arrastra sobre la grilla para definir precios diferenciales. Los cambios se guardan localmente hasta que confirmes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
