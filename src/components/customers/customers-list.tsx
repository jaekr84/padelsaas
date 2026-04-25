"use client";

import { useState } from "react";
import { 
  LucideSearch, 
  LucidePhone, 
  LucideMail, 
  LucideMoreVertical,
  LucideExternalLink,
  LucidePencil,
  LucideTrash2,
  LucideTrophy,
  LucideUsers,
  LucideArrowUpRight,
  LucideUser
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CustomersListProps {
  initialCustomers: any[];
}

export function CustomersList({ initialCustomers }: CustomersListProps) {
  const [search, setSearch] = useState("");

  const getAutoCategory = (customer: any) => {
    const bookingCount = customer.bookings?.length || 0;
    const salesCount = customer.sales?.length || 0;
    
    // Si el usuario ya tiene una categoría personalizada (que no sea la default), la respetamos
    if (customer.category && customer.category !== "Frecuente" && customer.category !== "FRECUENTE") {
      return { label: customer.category.toUpperCase(), color: "bg-slate-100 text-slate-950 border-slate-200" };
    }

    if (bookingCount >= 15 || salesCount >= 30) {
      return { label: "VIP / CORPORATIVO", color: "bg-blue-800 text-white border-blue-900" };
    }
    if (bookingCount >= 6) {
      return { label: "FRECUENTE", color: "bg-green-100 text-green-800 border-green-200" };
    }
    if (bookingCount >= 2) {
      return { label: "OCASIONAL", color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
    
    // Verificar si es nuevo (registrado hace menos de 7 días)
    const createdAt = new Date(customer.createdAt);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return { label: "NUEVO INGRESO", color: "bg-blue-50 text-blue-800 border-blue-200" };
    }

    return { label: "INACTIVO / LEAD", color: "bg-red-50 text-red-600 border-red-100" };
  };

  const filteredCustomers = initialCustomers.filter(customer => 
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    customer.dni?.includes(search) ||
    customer.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* 1. Industrial Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="FILTRAR POR NOMBRE, DNI O CORREO ELECTRÓNICO..." 
            className="pl-12 h-12 bg-white border-slate-200 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-[10px] tracking-widest placeholder:text-slate-300"
          />
        </div>
        <div className="flex items-center px-6 bg-slate-50 border border-slate-200 h-12">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros:</span>
            <span className="ml-3 text-sm font-black text-slate-950 tabular-nums">{filteredCustomers.length}</span>
        </div>
      </div>

      {/* 2. Customer Table - Accounting Industrial Style */}
      <div className="border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Identidad del Cliente</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Documentación</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Información de Contacto</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Categorización</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200 text-right">Crédito / Saldo</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group h-16">
                  <td className="px-6 py-4 border-r border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-950 flex items-center justify-center text-white font-black text-[10px] tracking-tighter uppercase transition-transform group-hover:scale-95">
                        {customer.firstName[0]}{customer.lastName[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-950 uppercase text-xs tracking-tight leading-none mb-1">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {customer.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-r border-slate-50">
                    <span className="text-[10px] font-black text-slate-950 tabular-nums tracking-widest uppercase">
                        {customer.dni || "---"}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-r border-slate-50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                        <LucidePhone className="h-3 w-3 text-blue-800" />
                        <span className="tabular-nums">{customer.phone || "---"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 lowercase tracking-tight">
                        <LucideMail className="h-3 w-3" />
                        {customer.email || "---"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-r border-slate-50">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const cat = getAutoCategory(customer);
                        return (
                          <div className={cn(
                            "border text-[8px] font-black uppercase tracking-widest px-2 py-1 transition-all",
                            cat.color
                          )}>
                            {cat.label}
                          </div>
                        );
                      })()}
                      {customer.padelLevel && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-800 uppercase tracking-widest">
                          <LucideTrophy className="h-3 w-3" />
                          Nivel {customer.padelLevel}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right border-r border-slate-50">
                    <div className="flex flex-col items-end">
                        <p className={cn(
                            "text-xs font-black tracking-widest tabular-nums",
                            Number(customer.balance) < 0 ? 'text-red-600' : 'text-slate-950'
                        )}>
                        $ {Number(customer.balance || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Disponibilidad de Cuenta</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none hover:bg-slate-950 hover:text-white transition-all border border-transparent">
                          <LucideMoreVertical className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-none border border-slate-200 shadow-2xl p-0 min-w-[180px]">
                        <DropdownMenuItem className="rounded-none font-black uppercase text-[9px] tracking-widest gap-3 py-3 cursor-pointer focus:bg-blue-800 focus:text-white">
                          <LucideArrowUpRight className="h-4 w-4" /> Ver Historial
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-none font-black uppercase text-[9px] tracking-widest gap-3 py-3 cursor-pointer focus:bg-blue-800 focus:text-white border-y border-slate-100">
                          <LucidePencil className="h-4 w-4" /> Editar Registro
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-none font-black uppercase text-[9px] tracking-widest gap-3 py-3 cursor-pointer text-red-600 focus:bg-red-600 focus:text-white">
                          <LucideTrash2 className="h-4 w-4" /> Baja del Sistema
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-6 bg-slate-50/30">
            <div className="h-16 w-16 bg-slate-100 flex items-center justify-center">
              <LucideUser className="h-8 w-8 text-slate-200" />
            </div>
            <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-300">Entidad no detectada en la base de datos</p>
          </div>
        )}
      </div>
    </div>
  );
}
