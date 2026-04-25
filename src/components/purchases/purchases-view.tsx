"use client";

import { useState } from "react";
import { 
  LucideShoppingCart, 
  LucidePlus, 
  LucideSearch, 
  LucideFileText, 
  LucideTruck,
  LucidePackage,
  LucideAlertTriangle,
  LucideClock,
  LucideInfo,
  LucideCheck,
  LucideShieldCheck,
  LucideChevronRight,
  LucideArrowUpRight,
  LucideBoxes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PurchaseForm } from "./PurchaseForm";
import { ProductForm } from "../inventory/product-form";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PurchasesViewProps {
  initialPurchases: any[];
  suppliers: any[];
  products: any[];
  categories: any[];
  centers: any[];
  expiringProducts: any[];
}

export function PurchasesView({ initialPurchases, suppliers, products, categories, centers, expiringProducts = [] }: PurchasesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [initialProductName, setInitialProductName] = useState("");

  const filteredPurchases = initialPurchases.filter((p) =>
    p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalCount = expiringProducts.filter(p => {
    const days = Math.ceil((new Date(p.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days <= 7;
  }).length;

  const warningCount = expiringProducts.length - criticalCount;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* 1. Interactive Technical Alerts */}
      {expiringProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => setIsExpiryModalOpen(true)}
            className="group flex items-center gap-6 bg-white border border-red-200 p-6 rounded-none hover:border-red-400 transition-all text-left relative"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
            <div className="h-14 w-14 bg-red-600 flex items-center justify-center text-white shrink-0 group-hover:bg-red-700 transition-colors">
              <LucideAlertTriangle className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-600 font-black uppercase tracking-widest text-sm leading-tight">Estado Crítico de Lotes</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1.5">
                {criticalCount} ARTÍCULOS CON VENCIMIENTO INFERIOR A 7 DÍAS
              </p>
            </div>
            <LucideChevronRight className="h-5 w-5 text-slate-300 group-hover:text-red-600 transition-all" />
          </button>

          <button 
            onClick={() => setIsExpiryModalOpen(true)}
            className="group flex items-center gap-6 bg-white border border-blue-200 p-6 rounded-none hover:border-blue-400 transition-all text-left relative"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-800" />
            <div className="h-14 w-14 bg-blue-800 flex items-center justify-center text-white shrink-0 group-hover:bg-blue-900 transition-colors">
              <LucideClock className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-blue-800 font-black uppercase tracking-widest text-sm leading-tight">Monitoreo de Vencimientos</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1.5">
                {warningCount} ARTÍCULOS EN VENTANA DE 8 A 30 DÍAS
              </p>
            </div>
            <LucideChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-800 transition-all" />
          </button>
        </div>
      )}

      {/* 2. Technical Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-6 bg-blue-800" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-800">Módulo de Abastecimiento</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">Registro de Compras</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Ingreso de suministros, gestión de lotes y control de facturación</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          <div className="relative flex-1 md:w-[400px]">
            <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="FILTRAR POR FACTURA O PROVEEDOR..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-white border-slate-200 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-[10px] tracking-widest placeholder:text-slate-300"
            />
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="h-12 bg-blue-800 hover:bg-blue-900 text-white rounded-none font-black uppercase tracking-[0.2em] text-[10px] px-8 transition-all gap-3 shadow-none"
          >
            <LucidePlus className="h-4 w-4" />
            Nueva Compra
          </Button>
        </div>
      </div>

      {/* 3. Purchases Matrix - Accounting Style */}
      <div className="border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Facturación / ID Sistema</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Entidad Proveedora</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Fecha Registro</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Detalle</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200 text-right">Total Neto</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center bg-slate-50/30">
                    <div className="flex flex-col items-center gap-6">
                      <div className="h-16 w-16 bg-slate-100 flex items-center justify-center">
                        <LucidePackage className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-300">No se registran movimientos de compra</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors group h-16">
                    <td className="px-6 py-4 border-r border-slate-50">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-950 tracking-tighter text-sm uppercase">{purchase.invoiceNumber || "SIN FACTURA"}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {purchase.id.slice(0,8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-950 flex items-center justify-center text-white font-black text-[10px] tracking-tighter uppercase transition-transform group-hover:scale-95">
                          {purchase.supplier?.name?.charAt(0) || "P"}
                        </div>
                        <span className="font-black text-slate-950 uppercase text-[11px] tracking-tight">{purchase.supplier?.name || "PROVEEDOR FINAL"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50 text-[11px] font-bold text-slate-600 uppercase tabular-nums">
                      {formatDate(purchase.createdAt)}
                    </td>
                    <td className="px-6 py-4 border-r border-slate-50">
                      <div className="bg-slate-100 border border-slate-200 text-slate-950 text-[8px] font-black uppercase tracking-widest px-2 py-1 inline-block">
                        {purchase.items?.length || 0} ÍTEMS REGISTRADOS
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right border-r border-slate-50">
                      <span className="font-black text-slate-950 text-sm tracking-widest tabular-nums">
                        {formatCurrency(purchase.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none hover:bg-slate-950 hover:text-white transition-all border border-transparent">
                        <LucideArrowUpRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <PurchaseForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        suppliers={suppliers} 
        products={products}
        categories={categories}
        centers={centers}
        onCreateProduct={(name: string) => {
          setInitialProductName(name);
          setIsProductModalOpen(true);
        }}
      />

      <ProductForm 
        open={isProductModalOpen}
        onOpenChange={setIsProductModalOpen}
        categories={categories}
        centers={centers}
        initialName={initialProductName}
      />

      {/* Modal de Detalle de Vencimientos - Industrial Style */}
      <Dialog open={isExpiryModalOpen} onOpenChange={setIsExpiryModalOpen}>
        <DialogContent className="!max-w-[1000px] rounded-none border border-slate-200 shadow-2xl p-0 gap-0 overflow-hidden bg-white flex flex-col">
          <DialogHeader className="bg-slate-950 p-8 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-4 bg-red-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Alerta de Seguridad Sanitaria</span>
                </div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                    Control de Vencimientos
                </DialogTitle>
            </div>
            <div className="h-12 w-12 bg-white/5 border border-white/10 flex items-center justify-center text-red-500 animate-pulse">
                <LucideAlertTriangle className="h-6 w-6" />
            </div>
          </DialogHeader>

          <div className="p-8 bg-slate-50 flex-1 overflow-auto">
            <div className="border border-slate-200 bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-left border-r border-slate-200">Especificación de Lote</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center border-r border-slate-200">Código de Lote</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center border-r border-slate-200">Existencia</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center border-r border-slate-200">Fecha de Caducidad</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center border-r border-slate-200">Días para Caducidad</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center">Riesgo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringProducts.sort((a,b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()).map((p) => {
                    const days = Math.ceil((new Date(p.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isCritical = days <= 7;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors h-14">
                        <td className="px-6 py-3 border-r border-slate-50">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-950 uppercase text-[10px] tracking-tight">{p.product?.name}</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">SKU: {p.product?.sku || "---"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center border-r border-slate-50 text-[10px] font-black text-slate-600 tabular-nums">{p.batchNumber || "SIN LOTE"}</td>
                        <td className="px-6 py-3 text-center border-r border-slate-50">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 font-black text-slate-950 text-[9px] uppercase tracking-tighter tabular-nums">{p.quantity} U.</span>
                        </td>
                        <td className="px-6 py-3 text-center border-r border-slate-50 font-black text-slate-950 text-[10px] tabular-nums">
                          {formatDate(p.expiryDate)}
                        </td>
                        <td className="px-6 py-3 text-center border-r border-slate-50">
                          <span className={cn(
                            "font-black px-2 py-1 text-[9px] uppercase tracking-widest tabular-nums",
                            isCritical ? "text-red-600 bg-red-50" : "text-blue-800 bg-blue-50"
                          )}>
                            {days < 0 ? "CADUCADO" : `${days} DÍAS REST.`}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className={cn(
                            "h-2 w-2 rounded-none mx-auto",
                            isCritical ? "bg-red-600 animate-pulse" : "bg-blue-800"
                          )} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white border-t border-slate-100 flex justify-end">
            <Button 
              onClick={() => setIsExpiryModalOpen(false)}
              className="bg-slate-950 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 h-12 rounded-none shadow-none"
            >
              Finalizar Reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
