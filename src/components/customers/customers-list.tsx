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
  LucideUsers
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

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  padelLevel: string | null;
  balance: string | null;
}

interface CustomersListProps {
  initialCustomers: any[];
}

export function CustomersList({ initialCustomers }: CustomersListProps) {
  const [search, setSearch] = useState("");

  const filteredCustomers = initialCustomers.filter(customer => 
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    customer.dni?.includes(search) ||
    customer.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda */}
      <div className="relative group max-w-md">
        <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="BUSCAR POR NOMBRE, DNI O EMAIL..." 
          className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all font-bold uppercase text-[10px] tracking-widest"
        />
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">DNI / Documento</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nivel / Cat.</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Saldo</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors uppercase">
                        {customer.firstName[0]}{customer.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 uppercase text-sm tracking-tight">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Cliente ID: {customer.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-600">{customer.dni || "---"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <LucidePhone className="h-3 w-3 text-slate-400" />
                        {customer.phone || "---"}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <LucideMail className="h-3 w-3" />
                        {customer.email || "---"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                        {customer.category || "Frecuente"}
                      </Badge>
                      {customer.padelLevel && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <LucideTrophy className="h-3 w-3" />
                          {customer.padelLevel}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className={`text-sm font-black tracking-tighter ${Number(customer.balance) < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                      ${customer.balance || '0.00'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
                          <LucideMoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]">
                        <DropdownMenuItem className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2 py-3 cursor-pointer">
                          <LucideExternalLink className="h-4 w-4" /> Ver Ficha
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2 py-3 cursor-pointer">
                          <LucidePencil className="h-4 w-4 text-blue-500" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2 py-3 cursor-pointer text-red-500">
                          <LucideTrash2 className="h-4 w-4" /> Eliminar
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
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
            <LucideUsers className="h-12 w-12 opacity-20" />
            <p className="font-black uppercase text-[10px] tracking-[0.2em]">No se encontraron clientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
