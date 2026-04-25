"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "@/lib/actions/auth-player";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  LucideBox,
  LucideArrowRight,
  LucideUser,
  LucideLock,
  LucideMail,
  LucideTrophy,
  LucideStore
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    isBusiness: false,
    businessName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (formData.isBusiness && !formData.businessName) {
        setError("El nombre del club es obligatorio para centros deportivos");
        setLoading(false);
        return;
      }

      const res = await registerAction(formData);

      if (res.success) {
        toast.success("Cuenta creada exitosamente. Iniciando sesión...");
        const loginRes = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (loginRes?.error) {
          toast.error("Error al iniciar sesión automáticamente");
          router.push("/login");
        } else {
          toast.success("Sesión iniciada");
          // Si es negocio, ir al dashboard. Si es jugador, al explorer.
          router.push(formData.isBusiness ? "/home" : "/explore");
        }
      } else {
        setError(res.error || "Error al registrarse");
        toast.error(res.error || "Error al registrarse");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Ocurrió un error inesperado");
      toast.error("Ocurrió un error inesperado durante el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/landing" className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-slate-950 flex items-center justify-center text-white">
          <LucideBox className="h-6 w-6" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">TU CANCHA YA</span>
      </Link>

      <Card className="w-full max-w-lg rounded-none border-2 border-slate-950 shadow-[10px_10px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
        <div className="flex border-b-2 border-slate-950">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isBusiness: false })}
            className={cn(
              "flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
              !formData.isBusiness ? "bg-blue-800 text-white" : "bg-white text-slate-400 hover:text-slate-950"
            )}
          >
            <LucideUser className="h-4 w-4" /> Jugador
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isBusiness: true })}
            className={cn(
              "flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border-l-2 border-slate-950",
              formData.isBusiness ? "bg-blue-800 text-white" : "bg-white text-slate-400 hover:text-slate-950"
            )}
          >
            <LucideStore className="h-4 w-4" /> Centro Deportivo
          </button>
        </div>

        <CardHeader className="space-y-4 pb-8 pt-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-800" />
            <CardTitle className="text-2xl font-black uppercase tracking-tighter">
              {formData.isBusiness ? "Terminal de Negocios" : "Terminal de Jugador"}
            </CardTitle>
          </div>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {formData.isBusiness
              ? "Crea tu organización y comienza a automatizar tu centro deportivo hoy mismo."
              : "Únete a la red para gestionar tus reservas y acceder a beneficios exclusivos."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {formData.isBusiness && (
              <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                <Label className="text-[9px] font-black uppercase tracking-widest text-blue-800">Nombre del Club / Centro</Label>
                <div className="relative">
                  <LucideTrophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-800" />
                  <Input
                    required
                    placeholder="WOLFF PADEL CENTER"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value.toUpperCase() })}
                    className="pl-10 h-12 rounded-none border-blue-800 bg-blue-50/30 font-black uppercase text-[10px] focus-visible:ring-0"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nombre del Responsable</Label>
                <div className="relative">
                  <LucideUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    placeholder="JUAN PÉREZ"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    className="pl-10 h-12 rounded-none border-slate-200 font-bold uppercase text-[10px] focus-visible:ring-0 focus-visible:border-blue-800"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Correo Electrónico</Label>
                <div className="relative">
                  <LucideMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    type="email"
                    placeholder="OPERADOR@SISTEMA.COM"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    className="pl-10 h-12 rounded-none border-slate-200 font-bold lowercase text-[10px] focus-visible:ring-0 focus-visible:border-blue-800"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Contraseña de Acceso</Label>
              <div className="relative">
                <LucideLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 h-12 rounded-none border-slate-200 font-bold text-[10px] focus-visible:ring-0 focus-visible:border-blue-800"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[9px] font-black uppercase">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 bg-slate-950 text-white rounded-none font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center justify-center gap-3"
              disabled={loading}
            >
              {loading ? "Sincronizando..." : formData.isBusiness ? "Crear Centro Deportivo" : "Confirmar Registro"} <LucideArrowRight className="h-5 w-5" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-100 flex flex-col py-6">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            ¿Ya tienes una terminal?{" "}
            <Link href="/login" className="text-blue-800 hover:underline">Acceder</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
