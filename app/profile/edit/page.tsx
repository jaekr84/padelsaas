"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LucideArrowLeft, LucideUser, LucideBox, LucidePhone, LucideCreditCard, LucideTrophy, LucideLock, LucideCheckCircle2 } from "lucide-react";
import Link from "next/link";
import { updateProfileAction, getProfileAction, changePasswordAction } from "@/lib/actions/profile";
import { useSession } from "next-auth/react";
import { ProvinceSelect, LocalitySelect } from "@/components/georef/georef-selects";

export default function EditProfilePage() {
   const { data: session, status, update } = useSession();
   const router = useRouter();
   
   const [name, setName] = useState("");
   const [phone, setPhone] = useState("");
   const [dni, setDni] = useState("");
   const [padelLevel, setPadelLevel] = useState("");
   const [city, setCity] = useState("");
   const [state, setState] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState("");
   const [isFetching, setIsFetching] = useState(true);

   // Password change state
   const [currentPassword, setCurrentPassword] = useState("");
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
   const [passwordError, setPasswordError] = useState("");
   const [passwordSuccess, setPasswordSuccess] = useState("");

   useEffect(() => {
      const fetchData = async () => {
         const result = await getProfileAction();
         if (result.success && result.data) {
            setName(result.data.name || "");
            setPhone(result.data.phone || "");
            setDni(result.data.dni || "");
            setPadelLevel(result.data.padelLevel || "");
            setCity(result.data.city || "");
            setState(result.data.state || "");
         }
         setIsFetching(false);
      };

      if (session?.user?.id) {
         fetchData();
      } else if (status !== "loading") {
         setIsFetching(false);
      }
   }, [session, status]);

   if (status === "loading" || isFetching) {
      return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black uppercase tracking-widest">Cargando...</div>;
   }

   if (status === "unauthenticated") {
      router.push("/login");
      return null;
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError("");

      const result = await updateProfileAction({ name, phone, dni, padelLevel, city, state });

      if (result.success) {
         await update({ name }); // Update session
         router.push("/profile");
         router.refresh();
      } else {
         setError(result.error || "Ocurrió un error");
         setIsSubmitting(false);
      }
   };

   const handlePasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError("");
      setPasswordSuccess("");

      if (newPassword !== confirmPassword) {
         setPasswordError("Las contraseñas nuevas no coinciden");
         return;
      }

      setIsPasswordSubmitting(true);
      const result = await changePasswordAction({ currentPassword, newPassword });

      if (result.success) {
         setPasswordSuccess("Contraseña actualizada con éxito");
         setCurrentPassword("");
         setNewPassword("");
         setConfirmPassword("");
      } else {
         setPasswordError(result.error || "Error al cambiar la contraseña");
      }
      setIsPasswordSubmitting(false);
   };

   return (
      <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-800 selection:text-white pb-20">
         <nav className="h-16 bg-white border-b-2 border-slate-950 px-6 flex items-center justify-between sticky top-0 z-50">
            <Link href="/explore" className="flex items-center gap-3">
               <div className="h-8 w-8 bg-slate-950 flex items-center justify-center text-white">
                  <LucideBox className="h-4 w-4" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">TU CANCHA YA</span>
            </Link>
         </nav>

         <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
            <div className="flex items-center gap-4">
               <Link href="/profile" className="h-10 w-10 bg-white border-2 border-slate-950 flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <LucideArrowLeft className="h-5 w-5" />
               </Link>
               <h1 className="text-3xl font-black uppercase tracking-tighter">Editar Perfil</h1>
            </div>

            <div className="space-y-12">
               {/* Informacion Personal */}
               <div className="bg-white border-2 border-slate-950 p-8 shadow-[8px_8px_0px_black]">
                  <div className="flex items-center gap-2 mb-8 border-b-2 border-slate-100 pb-4">
                     <LucideUser className="h-6 w-6 text-blue-800" />
                     <h2 className="text-xl font-black uppercase tracking-tight">Información Personal</h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                     {error && (
                        <div className="bg-red-50 text-red-600 p-4 border border-red-200 text-sm font-bold uppercase tracking-widest">
                           {error}
                        </div>
                     )}

                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                           Email (Solo lectura)
                        </label>
                        <input
                           type="email"
                           value={session?.user?.email || ""}
                           readOnly
                           className="w-full px-4 py-4 bg-slate-100 border-2 border-slate-200 text-slate-400 font-bold uppercase cursor-not-allowed"
                        />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Nombre Completo
                           </label>
                           <div className="relative">
                              <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <input
                                 type="text"
                                 value={name}
                                 onChange={(e) => setName(e.target.value)}
                                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-950 focus:outline-none transition-colors font-bold uppercase text-slate-950"
                                 placeholder="Tu nombre"
                                 required
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Teléfono
                           </label>
                           <div className="relative">
                              <LucidePhone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <input
                                 type="tel"
                                 value={phone}
                                 onChange={(e) => setPhone(e.target.value)}
                                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-950 focus:outline-none transition-colors font-bold uppercase text-slate-950"
                                 placeholder="Tu teléfono"
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              DNI
                           </label>
                           <div className="relative">
                              <LucideCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <input
                                 type="text"
                                 value={dni}
                                 onChange={(e) => setDni(e.target.value)}
                                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-950 focus:outline-none transition-colors font-bold uppercase text-slate-950"
                                 placeholder="Tu DNI"
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Nivel de Pádel (1.0 a 7.0)
                           </label>
                           <div className="relative">
                              <LucideTrophy className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <input
                                 type="text"
                                 value={padelLevel}
                                 onChange={(e) => setPadelLevel(e.target.value)}
                                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-950 focus:outline-none transition-colors font-bold uppercase text-slate-950"
                                 placeholder="Ej: 5.5"
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Provincia
                           </label>
                           <ProvinceSelect 
                              value={state} 
                              onChange={(val) => {
                                 setState(val);
                                 setCity("");
                              }} 
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Localidad
                           </label>
                           <LocalitySelect 
                              value={city} 
                              onChange={setCity} 
                              provinceName={state} 
                           />
                        </div>
                     </div>

                     <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-blue-800 text-white font-black uppercase tracking-widest hover:bg-blue-900 transition-colors disabled:opacity-50"
                     >
                        {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                     </button>
                  </form>
               </div>

               {/* Cambio de Contraseña */}
               <div className="bg-white border-2 border-slate-950 p-8 shadow-[8px_8px_0px_#ef4444]">
                  <div className="flex items-center gap-2 mb-8 border-b-2 border-slate-100 pb-4">
                     <LucideLock className="h-6 w-6 text-red-600" />
                     <h2 className="text-xl font-black uppercase tracking-tight">Cambiar Contraseña</h2>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                     {passwordError && (
                        <div className="bg-red-50 text-red-600 p-4 border border-red-200 text-sm font-bold uppercase tracking-widest">
                           {passwordError}
                        </div>
                     )}
                     {passwordSuccess && (
                        <div className="bg-green-50 text-green-600 p-4 border border-green-200 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                           <LucideCheckCircle2 className="h-4 w-4" />
                           {passwordSuccess}
                        </div>
                     )}

                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                           Contraseña Actual
                        </label>
                        <div className="relative">
                           <LucideLock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                           <input
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-950 focus:outline-none transition-colors font-bold text-slate-950"
                              placeholder="••••••••"
                              required
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Nueva Contraseña
                           </label>
                           <div className="relative">
                              <LucideLock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <input
                                 type="password"
                                 value={newPassword}
                                 onChange={(e) => setNewPassword(e.target.value)}
                                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-950 focus:outline-none transition-colors font-bold text-slate-950"
                                 placeholder="Mínimo 6 caracteres"
                                 required
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Confirmar Nueva Contraseña
                           </label>
                           <div className="relative">
                              <LucideLock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <input
                                 type="password"
                                 value={confirmPassword}
                                 onChange={(e) => setConfirmPassword(e.target.value)}
                                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-950 focus:outline-none transition-colors font-bold text-slate-950"
                                 placeholder="Repite la contraseña"
                                 required
                              />
                           </div>
                        </div>
                     </div>

                     <button
                        type="submit"
                        disabled={isPasswordSubmitting}
                        className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
                     >
                        {isPasswordSubmitting ? "Cambiando..." : "Actualizar Contraseña"}
                     </button>
                  </form>
               </div>
            </div>
         </main>
      </div>
   );
}
