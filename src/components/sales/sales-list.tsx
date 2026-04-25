"use client";

import { 
  LucideReceipt, 
  LucideCalendar, 
  LucideUser, 
  LucideCreditCard, 
  LucideBanknote, 
  LucideBuilding2,
  LucideSearch,
  LucideEye,
  LucideFilter,
  LucideLaptop,
  LucideX
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SalesListProps {
  sales: any[];
}

export function SalesList({ sales }: SalesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  // Inicializar con el mes corriente (YYYY-MM)
  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [terminalFilter, setTerminalFilter] = useState("all");

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.saleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Si dateFilter tiene formato YYYY-MM-DD o YYYY-MM, hacemos el match
    // sale.createdAt es un objeto Date, lo convertimos a string para comparar
    const createdAtStr = sale.createdAt instanceof Date 
      ? sale.createdAt.toISOString() 
      : typeof sale.createdAt === 'string' 
        ? sale.createdAt 
        : "";

    const matchesDate = !dateFilter || createdAtStr.startsWith(dateFilter);
    
    const matchesPayment = paymentFilter === "all" || sale.paymentMethod === paymentFilter;
    
    const matchesTerminal = terminalFilter === "all" || sale.terminalId === terminalFilter;

    return matchesSearch && matchesDate && matchesPayment && matchesTerminal;
  });

  const clearFilters = () => {
    setSearchTerm("");
    const now = new Date();
    setDateFilter(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);
    setPaymentFilter("all");
    setTerminalFilter("all");
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-slate-900 mb-2">
          <LucideFilter className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Filtros de Búsqueda</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-1">
            <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Número o cliente..." 
              className="pl-10 h-11 bg-slate-50/50 rounded-xl border-slate-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <div className="relative">
              <LucideCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input 
                type="month"
                className="pl-10 h-11 bg-slate-50/50 rounded-xl border-slate-100 font-medium"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <Select value={paymentFilter} onValueChange={(val) => val && setPaymentFilter(val)}>
            <SelectTrigger className="h-11 bg-slate-50/50 rounded-xl border-slate-100 font-medium">
              <div className="flex items-center gap-2">
                <LucideCreditCard className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="Medio de Pago" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="all">Todos los medios</SelectItem>
              <SelectItem value="Efectivo">Efectivo</SelectItem>
              <SelectItem value="Débito">Débito</SelectItem>
              <SelectItem value="Crédito">Crédito</SelectItem>
              <SelectItem value="Transferencia">Transferencia</SelectItem>
            </SelectContent>
          </Select>

          <Select value={terminalFilter} onValueChange={(val) => val && setTerminalFilter(val)}>
            <SelectTrigger className="h-11 bg-slate-50/50 rounded-xl border-slate-100 font-medium">
              <div className="flex items-center gap-2">
                <LucideLaptop className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="Terminal" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="all">Todas las terminales</SelectItem>
              <SelectItem value="Caja 1">Caja 1</SelectItem>
              <SelectItem value="Caja 2">Caja 2</SelectItem>
              <SelectItem value="Móvil 1">Móvil 1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="text-sm text-slate-500 font-medium">
            Mostrando <span className="text-slate-900 font-bold">{filteredSales.length}</span> ventas
          </div>
          
          {(searchTerm || dateFilter || paymentFilter !== "all" || terminalFilter !== "all") && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-slate-500 hover:text-red-600 h-8 gap-2 rounded-lg"
            >
              <LucideX className="w-3.5 h-3.5" />
              Limpiar Filtros
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Venta</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Centro</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <LucideReceipt className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-bold text-slate-900">{sale.saleNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700 font-medium">
                        {formatDateTime(sale.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <LucideUser className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm text-slate-700">{sale.customerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <LucideBuilding2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm text-slate-700">{sale.center?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className={cn(
                      "font-medium",
                      sale.paymentMethod === 'Efectivo' ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-700"
                    )}>
                      {sale.paymentMethod === 'Efectivo' ? (
                        <LucideBanknote className="w-3 h-3 mr-1" />
                      ) : (
                        <LucideCreditCard className="w-3 h-3 mr-1" />
                      )}
                      {sale.paymentMethod}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(sale.total)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                      <LucideEye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <LucideReceipt className="w-12 h-12 opacity-20" />
                      <p>No se encontraron ventas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
