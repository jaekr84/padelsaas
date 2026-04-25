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
  LucideCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Alertas Interactivas */}
      {expiringProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setIsExpiryModalOpen(true)}
            className="group flex items-center gap-6 bg-red-50 border border-red-100 p-6 rounded-[2rem] hover:bg-red-100 transition-all text-left relative overflow-hidden"
          >
            <div className="h-16 w-16 bg-red-500 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-red-200">
              <LucideAlertTriangle className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-900 font-black uppercase tracking-tighter text-xl">Alertas Críticas</h3>
              <p className="text-red-700/70 font-bold uppercase tracking-widest text-[10px]">
                {criticalCount} productos vencen en menos de 7 días
              </p>
            </div>
            <LucideInfo className="h-5 w-5 text-red-300 group-hover:text-red-500" />
          </button>

          <button 
            onClick={() => setIsExpiryModalOpen(true)}
            className="group flex items-center gap-6 bg-orange-50 border border-orange-100 p-6 rounded-[2rem] hover:bg-orange-100 transition-all text-left relative overflow-hidden"
          >
            <div className="h-16 w-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-orange-200">
              <LucideClock className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-orange-900 font-black uppercase tracking-tighter text-xl">Próximos Vencimientos</h3>
              <p className="text-orange-700/70 font-bold uppercase tracking-widest text-[10px]">
                {warningCount} productos vencen en 8-30 días
              </p>
            </div>
            <LucideInfo className="h-5 w-5 text-orange-300 group-hover:text-orange-500" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <LucideShoppingCart className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Gestión de Compras</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm ml-1">Historial de órdenes e ingreso de stock</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 min-w-[350px]">
            <LucideSearch className="h-4 w-4 text-slate-400 ml-2" />
            <Input 
              placeholder="Buscar por factura o proveedor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none bg-transparent focus-visible:ring-0 font-bold text-sm"
            />
          </div>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-8 h-14 shadow-blue-100 shadow-2xl rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          >
            <LucidePlus className="h-4 w-4" />
            Nueva Compra
          </Button>
        </div>
      </div>

      {/* Purchases List Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Factura / ID</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Proveedor</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fecha</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Artículos</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Total</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <LucidePackage className="h-16 w-16 text-slate-400" />
                      <p className="font-black uppercase tracking-widest text-xs">No se encontraron compras</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-lg">{purchase.invoiceNumber || "S/N"}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {purchase.id.slice(0,8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs">
                          {purchase.supplier?.name?.charAt(0) || "C"}
                        </div>
                        <span className="font-black text-slate-700 uppercase tracking-tight">{purchase.supplier?.name || "Consumidor Final"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-slate-500 text-sm">
                        {formatDate(purchase.createdAt)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="bg-blue-50 px-3 py-1 rounded-lg w-fit">
                        <span className="font-black text-blue-600 text-[10px] uppercase tracking-tighter">{purchase.items?.length || 0} Ítems</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-900 text-xl tracking-tighter">
                      {formatCurrency(purchase.totalAmount)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <LucideInfo className="h-5 w-5" />
                        </Button>
                      </div>
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

      {/* Modal de Detalle de Vencimientos */}
      <Dialog open={isExpiryModalOpen} onOpenChange={setIsExpiryModalOpen}>
        <DialogContent className="!max-w-[90vw] !w-[90vw] !max-h-[85vh] !h-[85vh] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl flex flex-col">
          <div className="bg-orange-600 px-8 py-6 text-white relative shrink-0">
            <LucideClock className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 rotate-12" />
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                <LucideAlertTriangle className="h-8 w-8" />
                Control de Vencimientos
              </DialogTitle>
            </DialogHeader>
            <p className="text-orange-100 font-bold uppercase tracking-widest text-[10px] mt-1 opacity-80">
              Productos con fecha de vencimiento próxima (30 días)
            </p>
          </div>

          <div className="flex-1 overflow-auto p-8 bg-slate-50">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left">Producto</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Lote</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Stock</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Vencimiento</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Días Restantes</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px]">
                  {expiringProducts.sort((a,b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()).map((p) => {
                    const days = Math.ceil((new Date(p.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isCritical = days <= 7;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-700 uppercase">{p.product?.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SKU: {p.product?.sku || "---"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-500">{p.batchNumber || "S/L"}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-slate-600">{p.quantity} UN</span>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-slate-700">
                          {formatDate(p.expiryDate)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "font-black px-3 py-1 rounded-lg inline-block min-w-[80px]",
                            isCritical ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                          )}>
                            {days < 0 ? "VENCIDO" : `${days} DÍAS`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={cn(
                            "h-2 w-2 rounded-full mx-auto animate-pulse",
                            isCritical ? "bg-red-500" : "bg-orange-500"
                          )} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white border-t border-slate-50">
            <Button 
              onClick={() => setIsExpiryModalOpen(false)}
              className="bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs px-10 h-12 rounded-2xl shadow-xl transition-all"
            >
              Cerrar Reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
