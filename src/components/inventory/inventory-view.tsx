"use client";

import { useState } from "react";
import { 
  LucidePackage, 
  LucidePlus, 
  LucideSearch, 
  LucideAlertTriangle,
  LucideHistory,
  LucideMoreVertical,
  LucidePencil,
  LucideTrash2,
  LucideArrowUpRight,
  LucideArrowDownLeft,
  LucideShieldCheck,
  LucideBoxes,
  LucideCoins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductForm } from "./product-form";
import { deleteProductAction } from "@/lib/actions/products";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InventoryViewProps {
  products: any[];
  categories: any[];
}

export function InventoryView({ products: initialProducts, categories }: InventoryViewProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockProducts = products.filter(p => {
    const totalStock = p.stock?.reduce((acc: number, curr: any) => acc + curr.stock, 0) || 0;
    return totalStock <= p.minStock;
  });

  const totalInventoryValue = products.reduce((acc, p) => acc + (p.buyPrice * (p.stock?.reduce((sAcc: number, sCurr: any) => sAcc + sCurr.stock, 0) || 0)), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* 1. Technical Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-6 bg-blue-800" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-800">Gestión de Activos</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">Inventario & Kiosco</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Control de existencias, suministros y valorización de stock</p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            className="h-12 bg-blue-800 hover:bg-blue-900 text-white rounded-none font-black uppercase tracking-[0.2em] text-[10px] px-8 transition-all gap-3 shadow-none"
          >
            <LucidePlus className="h-4 w-4" />
            Alta de Artículo
          </Button>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) - Industrial Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white border border-slate-200 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades en Stock</span>
            <LucideBoxes className="h-4 w-4 text-blue-800" />
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter text-slate-950">
              {products.length}<span className="text-slate-300 mx-2 text-3xl font-light">|</span><span className="text-blue-800">{products.reduce((acc, p) => acc + (p.stock?.reduce((sAcc: number, sCurr: any) => sAcc + sCurr.stock, 0) || 0), 0)}</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
              SKUS REGISTRADOS / UNIDADES TOTALES
            </p>
          </div>
        </div>

        <div className={cn(
            "p-6 flex flex-col gap-4 border transition-all",
            lowStockProducts.length > 0 
                ? "bg-red-50 border-red-200" 
                : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between border-b border-slate-100/50 pb-3">
            <span className={cn("text-[10px] font-black uppercase tracking-widest", lowStockProducts.length > 0 ? "text-red-400" : "text-slate-400")}>Alertas de Reposición</span>
            <LucideAlertTriangle className={cn("h-4 w-4", lowStockProducts.length > 0 ? "text-red-500 animate-pulse" : "text-slate-400")} />
          </div>
          <div>
            <div className={cn("text-4xl font-black tracking-tighter", lowStockProducts.length > 0 ? "text-red-600" : "text-slate-950")}>
              {lowStockProducts.length}
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
              ARTÍCULOS BAJO EL MÍNIMO OPERATIVO
            </p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-950 p-6 flex flex-col gap-4 text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Valorización Activa</span>
            <LucideCoins className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="text-4xl font-black tracking-tighter text-white tabular-nums">
              $ {totalInventoryValue.toLocaleString('es-AR')}
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
              VALOR TOTAL DEL INVENTARIO A COSTO
            </p>
          </div>
        </div>
      </div>

      {/* 3. Product Matrix - Accounting Style */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-1">
                <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="FILTRAR POR NOMBRE DE ARTÍCULO O SKU..." 
                    className="pl-12 h-12 bg-white border-slate-200 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-[10px] tracking-widest placeholder:text-slate-300"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="border border-slate-200 bg-white">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Especificación de Producto</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200">Categoría</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200 text-center">Estado de Stock</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 border-r border-slate-200 text-right">Valorización (Venta/Costo)</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-right">Acciones</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                    const totalStock = p.stock?.reduce((acc: number, curr: any) => acc + curr.stock, 0) || 0;
                    const isLowStock = totalStock <= p.minStock;

                    return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group h-16">
                        <td className="px-6 py-4 border-r border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-slate-950 flex items-center justify-center text-white font-black text-[10px] tracking-tighter uppercase transition-transform group-hover:scale-95">
                                    {p.name.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="font-black text-slate-950 uppercase text-xs tracking-tight leading-none mb-1">{p.name}</p>
                                    <p className="text-[9px] text-slate-400 font-mono tracking-widest">SKU: {p.sku || 'N/A'}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-50">
                            <div className="bg-slate-100 border border-slate-200 text-slate-950 text-[8px] font-black uppercase tracking-widest px-2 py-1 inline-block">
                                {p.category?.name || 'GENERAL'}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-50">
                            <div className="flex flex-col items-center">
                                <span className={cn(
                                    "text-lg font-black tracking-tighter tabular-nums",
                                    isLowStock ? "text-red-600" : "text-blue-800"
                                )}>
                                    {totalStock}
                                </span>
                                {isLowStock && (
                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">STOCK CRÍTICO</span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right border-r border-slate-50">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-slate-950 tracking-widest tabular-nums">$ {p.sellPrice.toLocaleString()}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Costo: $ {p.buyPrice.toLocaleString()}</span>
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
                                    <DropdownMenuItem 
                                        className="rounded-none font-black uppercase text-[9px] tracking-widest gap-3 py-3 cursor-pointer focus:bg-blue-800 focus:text-white"
                                        onClick={() => {
                                            setEditingProduct(p);
                                            setIsFormOpen(true);
                                        }}
                                    >
                                        <LucidePencil className="h-4 w-4" /> Editar Artículo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-none font-black uppercase text-[9px] tracking-widest gap-3 py-3 cursor-pointer text-red-600 focus:bg-red-600 focus:text-white">
                                        <LucideTrash2 className="h-4 w-4" /> Baja de Stock
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            {filteredProducts.length === 0 && (
                <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-6 bg-slate-50/30">
                    <div className="h-16 w-16 bg-slate-100 flex items-center justify-center">
                        <LucidePackage className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-300">Artículos no detectados en el almacén</p>
                </div>
            )}
            </div>
        </div>
      </div>

      <ProductForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        product={editingProduct} 
        categories={categories}
      />
    </div>
  );
}
