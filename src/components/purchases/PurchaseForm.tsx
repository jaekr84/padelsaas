"use client";

import { useState, useMemo } from "react";
import {
  LucideShoppingCart,
  LucidePlus,
  LucideSearch,
  LucideTrash2,
  LucideTruck,
  LucidePackage,
  LucideDollarSign,
  LucideHash,
  LucideInfo,
  LucideCheck,
  LucideShieldCheck,
  LucideBox,
  LucideBarcode,
  LucideCalendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addPurchaseAction, addSupplierAction } from "@/lib/actions/purchases";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface PurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: any[];
  products: any[];
  categories: any[];
  centers: any[];
  onCreateProduct: (name: string) => void;
}

export function PurchaseForm({ open, onOpenChange, suppliers, products, categories, centers, onCreateProduct }: PurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState<string>("none");
  const [centerId, setCenterId] = useState<string>(centers[0]?.id || "");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number; unitCost: number; expiryDate?: string; batchNumber?: string }[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [centerOpen, setCenterOpen] = useState(false);

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const handleCreateSupplier = async () => {
    if (!supplierSearch) return;
    setIsCreatingSupplier(true);
    try {
      const newSup = await addSupplierAction(supplierSearch);
      setSupplierId(newSup.id);
      setSupplierOpen(false);
      setSupplierSearch("");
      toast.success(`Proveedor "${supplierSearch}" creado`);
    } catch (error) {
      toast.error("Error al crear proveedor");
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 5);
  }, [productSearch, products]);

  const addItem = (product: any) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { productId: product.id, quantity: 1, unitCost: product.buyPrice || 0, expiryDate: "", batchNumber: "" }]);
    }
    setProductSearch("");
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const updateItem = (productId: string, field: "quantity" | "unitCost" | "expiryDate" | "batchNumber", value: any) => {
    setItems(items.map(i => i.productId === productId ? { ...i, [field]: value } : i));
  };

  const total = items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Debes agregar al menos un producto");
      return;
    }
    if (!centerId) {
      toast.error("Debes seleccionar una sede");
      return;
    }

    setLoading(true);
    try {
      await addPurchaseAction({
        supplierId: supplierId === "none" ? undefined : supplierId,
        centerId,
        invoiceNumber,
        notes,
        items,
      });
      toast.success("Compra registrada correctamente");
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar la compra");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSupplierId("none");
    setInvoiceNumber("");
    setNotes("");
    setItems([]);
    setProductSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[95vh] !h-[95vh] p-0 overflow-hidden rounded-none border border-slate-200 shadow-2xl flex flex-col bg-white">
        {/* Header Industrial */}
        <div className="bg-slate-950 p-8 flex flex-row items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-4 bg-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Control de Abastecimiento</span>
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                Orden de Compra / Ingreso de Stock
            </DialogTitle>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Neto de Orden</p>
              <p className="text-4xl font-black tracking-tighter text-white tabular-nums">{formatCurrency(total)}</p>
            </div>
            <div className="h-12 w-12 bg-white/5 border border-white/10 flex items-center justify-center text-blue-500">
               <LucideShoppingCart className="h-6 w-6" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar Operativa */}
          <div className="p-6 border-b border-slate-200 bg-slate-50 space-y-6 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Proveedor / Emisor</Label>
                <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-between bg-white border-slate-200 rounded-none font-bold uppercase text-[10px] tracking-widest"
                    >
                      {supplierId && supplierId !== "none"
                        ? suppliers.find((s) => s.id === supplierId)?.name
                        : "SIN PROVEEDOR (FINAL)"}
                      <LucidePlus className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  } />
                  <PopoverContent className="w-[300px] p-0 rounded-none border-slate-200 shadow-xl" align="start">
                    <div className="p-3 border-b bg-slate-50">
                      <div className="relative">
                        <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          placeholder="BUSCAR PROVEEDOR..."
                          className="h-9 pl-9 text-[10px] font-black uppercase tracking-widest bg-white border-slate-200 rounded-none"
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto p-1 bg-white">
                      <button type="button" onClick={() => { setSupplierId("none"); setSupplierOpen(false); }} className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 hover:text-white transition-colors">SIN PROVEEDOR</button>
                      {filteredSuppliers.map((s) => (
                        <button key={s.id} type="button" onClick={() => { setSupplierId(s.id); setSupplierOpen(false); }} className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 hover:text-white transition-colors flex justify-between items-center group">
                          {s.name} {supplierId === s.id && <LucideCheck className="h-3 w-3" />}
                        </button>
                      ))}
                      {supplierSearch && !suppliers.some(s => s.name.toLowerCase() === supplierSearch.toLowerCase()) && (
                        <button type="button" onClick={handleCreateSupplier} className="w-full text-left px-3 py-3 text-[10px] font-black uppercase tracking-widest text-blue-800 hover:bg-blue-50 border-t border-slate-100 mt-1 flex items-center gap-2">
                           <LucidePlus className="h-3 w-3" /> CREAR "{supplierSearch}"
                        </button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Centro de Destino</Label>
                <Popover open={centerOpen} onOpenChange={setCenterOpen}>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-between bg-white border-slate-200 rounded-none font-bold uppercase text-[10px] tracking-widest"
                    >
                      {centerId ? centers.find((c) => c.id === centerId)?.name : "SELECCIONAR SEDE"}
                      <LucidePlus className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  } />
                  <PopoverContent className="w-[200px] p-1 rounded-none border-slate-200 shadow-xl">
                    {centers.map((c) => (
                      <button key={c.id} type="button" onClick={() => { setCenterId(c.id); setCenterOpen(false); }} className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 hover:text-white transition-colors flex justify-between items-center">
                        {c.name} {centerId === c.id && <LucideCheck className="h-3 w-3" />}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nro de Comprobante / Factura</Label>
                <div className="relative">
                    <LucideHash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="0000-00000000" className="pl-12 h-12 bg-white border-slate-200 rounded-none font-black uppercase text-xs tracking-widest focus-visible:ring-0 focus-visible:border-blue-800" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Buscador de Artículos</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="ESCRIBE O ESCANEA..."
                      className="pl-12 h-12 bg-white border-blue-100 rounded-none font-bold uppercase text-[10px] tracking-widest placeholder:text-slate-300 focus-visible:ring-0 focus-visible:border-blue-800"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white rounded-none shadow-2xl border border-slate-200 p-1 overflow-hidden">
                        {filteredProducts.map((p) => (
                          <button key={p.id} type="button" onClick={() => addItem(p)} className="w-full text-left px-4 py-3 hover:bg-blue-800 hover:text-white flex items-center justify-between group transition-colors">
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-[10px] tracking-tight">{p.name}</span>
                              <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">SKU: {p.sku || "N/A"}</span>
                            </div>
                            <LucidePlus className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="button" onClick={() => onCreateProduct(productSearch)} className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 font-black uppercase text-[9px] tracking-widest rounded-none px-4">+ ARTÍCULO</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Matriz de Ingreso - Accounting Style */}
          <div className="flex-1 overflow-auto bg-slate-50">
            <div className="min-w-[1200px] p-8">
               <div className="border border-slate-200 bg-white">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-left w-12 border-r border-slate-200">#</th>
                        <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-left border-r border-slate-200">Especificación de Producto</th>
                        <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center w-48 border-r border-slate-200">Identificación de Lote</th>
                        <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center w-32 border-r border-slate-200">Unidades</th>
                        <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center w-40 border-r border-slate-200">Costo Unit. (Neto)</th>
                        <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center w-48 border-r border-slate-200">Fecha Caducidad</th>
                        <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-right w-40 border-r border-slate-200">Subtotal Neto</th>
                        <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-950 text-center w-16">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-24 text-center bg-white">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-12 w-12 bg-slate-50 flex items-center justify-center">
                                    <LucideBox className="h-6 w-6 text-slate-200" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Orden de compra vacía</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <tr key={item.productId} className="hover:bg-slate-50 transition-colors h-14 group">
                              <td className="px-4 py-2 text-[10px] font-black text-slate-400 border-r border-slate-100 tabular-nums">{index + 1}</td>
                              <td className="px-4 py-2 border-r border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-slate-950 flex items-center justify-center text-white font-black text-[9px] tracking-tighter uppercase shrink-0">
                                        {product?.name.substring(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-950 uppercase text-[10px] leading-tight mb-0.5">{product?.name}</span>
                                        <span className="text-[8px] text-slate-400 font-bold tracking-widest">SKU: {product?.sku || "---"}</span>
                                    </div>
                                </div>
                              </td>
                              <td className="px-2 py-1 border-r border-slate-100">
                                <div className="relative">
                                    <LucideBarcode className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                                    <Input
                                        placeholder="NRO LOTE"
                                        value={item.batchNumber}
                                        onChange={(e) => updateItem(item.productId, "batchNumber", e.target.value)}
                                        className="h-9 pl-7 border-transparent focus:bg-white focus:border-blue-200 bg-transparent text-center font-black text-[10px] uppercase shadow-none rounded-none"
                                    />
                                </div>
                              </td>
                              <td className="px-2 py-1 border-r border-slate-100">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.productId, "quantity", parseInt(e.target.value) || 0)}
                                  className="h-9 border-transparent focus:bg-white focus:border-blue-200 bg-transparent text-center font-black text-[11px] tabular-nums shadow-none rounded-none"
                                />
                              </td>
                              <td className="px-2 py-1 border-r border-slate-100">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">$</span>
                                  <Input
                                    type="number"
                                    value={item.unitCost}
                                    onChange={(e) => updateItem(item.productId, "unitCost", parseFloat(e.target.value) || 0)}
                                    className="h-9 pl-5 border-transparent focus:bg-white focus:border-blue-200 bg-transparent text-center font-black text-[11px] tabular-nums shadow-none rounded-none"
                                  />
                                </div>
                              </td>
                              <td className="px-2 py-1 border-r border-slate-100">
                                <div className="relative">
                                    <LucideCalendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                                    <Input
                                        type="date"
                                        value={item.expiryDate}
                                        onChange={(e) => updateItem(item.productId, "expiryDate", e.target.value)}
                                        className="h-9 pl-7 border-transparent focus:bg-white focus:border-blue-200 bg-transparent text-center font-black text-[10px] tabular-nums shadow-none rounded-none p-0 cursor-pointer"
                                    />
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right font-black text-slate-950 text-[11px] tabular-nums bg-slate-50/30 border-r border-slate-100">
                                {formatCurrency(item.quantity * item.unitCost)}
                              </td>
                              <td className="px-2 py-1 text-center">
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.productId)} className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-none transition-colors">
                                  <LucideTrash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>

          {/* Footer Operativo */}
          <div className="p-8 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-12">
            <div className="flex-1 max-w-2xl space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Observaciones Técnicas / Notas Internas</Label>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-none p-4 text-[10px] font-black uppercase tracking-widest focus:border-blue-800 outline-none h-16 resize-none transition-all placeholder:text-slate-300"
                  placeholder="DETALLES ADICIONALES DE LA CARGA..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-black uppercase text-[10px] tracking-widest px-10 h-14 rounded-none border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">Descartar</Button>
              <Button type="submit" disabled={loading || items.length === 0} className="bg-blue-800 hover:bg-blue-900 text-white font-black uppercase text-[10px] tracking-[0.2em] px-12 h-14 rounded-none shadow-none transition-all">
                {loading ? "Sincronizando..." : "Confirmar Orden"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
