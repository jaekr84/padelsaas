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
  LucideCheck
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
      toast.success("Compra registrada correctamente y stock actualizado");
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
      <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[95vh] !h-[95vh] p-0 overflow-hidden rounded-3xl border-none shadow-2xl flex flex-col">
        {/* Header Compacto */}
        <div className="bg-blue-600 px-8 py-4 text-white relative overflow-hidden shrink-0">
          <LucideShoppingCart className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 rotate-12" />
          <div className="flex justify-between items-center relative z-10">
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <LucideShoppingCart className="h-6 w-6" />
                  Nueva Orden de Compra
                </DialogTitle>
              </DialogHeader>
              <p className="text-blue-100 font-bold uppercase tracking-widest text-[9px] opacity-80">
                Panel de Ingreso de Mercadería y Control de Lotes
              </p>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Total Orden</p>
                  <p className="text-3xl font-black tracking-tighter">{formatCurrency(total)}</p>
               </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Top Bar: Selectores y Buscador */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 space-y-4 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Proveedor</Label>
                <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      className="w-full justify-between font-bold border-slate-200 rounded-xl h-10 bg-white"
                    >
                      {supplierId && supplierId !== "none"
                        ? suppliers.find((s) => s.id === supplierId)?.name
                        : "Sin Proveedor (Final)"}
                      <LucidePlus className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  } />
                  <PopoverContent className="w-[240px] p-0" align="start">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <LucideSearch className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          placeholder="Buscar..."
                          className="h-8 pl-8 text-xs font-medium"
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      <button type="button" onClick={() => { setSupplierId("none"); setSupplierOpen(false); }} className="w-full text-left px-2 py-1.5 text-xs font-bold uppercase hover:bg-slate-100 rounded-md">Sin Proveedor</button>
                      {filteredSuppliers.map((s) => (
                        <button key={s.id} type="button" onClick={() => { setSupplierId(s.id); setSupplierOpen(false); }} className="w-full text-left px-2 py-1.5 text-xs font-bold uppercase hover:bg-slate-100 rounded-md flex justify-between items-center">
                          {s.name} {supplierId === s.id && <LucideCheck className="h-3 w-3 text-blue-600" />}
                        </button>
                      ))}
                      {supplierSearch && !suppliers.some(s => s.name.toLowerCase() === supplierSearch.toLowerCase()) && (
                        <button type="button" onClick={handleCreateSupplier} className="w-full text-left px-2 py-2 text-xs font-black uppercase text-blue-600 hover:bg-blue-50 border-t mt-1">+ Crear "{supplierSearch}"</button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sede</Label>
                <Popover open={centerOpen} onOpenChange={setCenterOpen}>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      className="w-full justify-between font-bold border-slate-200 rounded-xl h-10 bg-white"
                    >
                      {centerId ? centers.find((c) => c.id === centerId)?.name : "Seleccionar"}
                      <LucidePlus className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  } />
                  <PopoverContent className="w-[200px] p-1">
                    {centers.map((c) => (
                      <button key={c.id} type="button" onClick={() => { setCenterId(c.id); setCenterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold uppercase hover:bg-slate-100 rounded-md flex justify-between items-center">
                        {c.name} {centerId === c.id && <LucideCheck className="h-3 w-3 text-blue-600" />}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Factura</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="0000-00000000" className="font-bold h-10 rounded-xl bg-white" />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Buscador de Productos</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Escribe o escanea..."
                      className="pl-9 h-10 bg-white border-blue-100 rounded-xl font-bold"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white rounded-xl shadow-2xl border p-1 border-blue-50 overflow-hidden">
                        {filteredProducts.map((p) => (
                          <button key={p.id} type="button" onClick={() => addItem(p)} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg flex items-center justify-between group">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-700 uppercase text-[10px]">{p.name}</span>
                              <span className="text-[8px] font-bold text-slate-400">{p.sku || "Sin SKU"}</span>
                            </div>
                            <LucidePlus className="h-3 w-3 text-blue-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="button" onClick={() => onCreateProduct(productSearch)} className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[9px] rounded-xl px-4">+ Producto</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla Estilo Excel */}
          <div className="flex-1 overflow-auto bg-slate-50">
            <div className="min-w-[1000px] p-4">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-left w-12 border-r border-slate-200/50">#</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-left border-r border-slate-200/50">Producto</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center w-40 border-r border-slate-200/50">Lote / Partida</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center w-28 border-r border-slate-200/50">Cant.</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center w-36 border-r border-slate-200/50">Costo Unit.</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center w-40 border-r border-slate-200/50">Vencimiento</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right w-36 border-r border-slate-200/50">Subtotal</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-20 text-center">
                            <LucidePackage className="h-12 w-12 text-slate-200 mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No hay productos en la orden</p>
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <tr key={item.productId} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-4 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100">{index + 1}</td>
                              <td className="px-4 py-2 border-r border-slate-100">
                                <div className="flex flex-col">
                                  <span className="font-black text-slate-700 uppercase text-[10px] leading-none mb-1">{product?.name}</span>
                                  <span className="text-[8px] text-slate-400 font-bold">SKU: {product?.sku || "---"}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 border-r border-slate-100">
                                <Input
                                  placeholder="Nro Lote"
                                  value={item.batchNumber}
                                  onChange={(e) => updateItem(item.productId, "batchNumber", e.target.value)}
                                  className="h-8 border-transparent focus:border-blue-200 bg-transparent text-center font-bold text-[10px] uppercase shadow-none"
                                />
                              </td>
                              <td className="px-2 py-1 border-r border-slate-100">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.productId, "quantity", parseInt(e.target.value) || 0)}
                                  className="h-8 border-transparent focus:border-blue-200 bg-transparent text-center font-black text-[10px] shadow-none"
                                />
                              </td>
                              <td className="px-2 py-1 border-r border-slate-100">
                                <div className="relative">
                                  <LucideDollarSign className="absolute left-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-slate-300" />
                                  <Input
                                    type="number"
                                    value={item.unitCost}
                                    onChange={(e) => updateItem(item.productId, "unitCost", parseFloat(e.target.value) || 0)}
                                    className="h-8 border-transparent focus:border-blue-200 bg-transparent text-center font-black text-[10px] pl-4 shadow-none"
                                  />
                                </div>
                              </td>
                              <td className="px-2 py-1 border-r border-slate-100">
                                <Input
                                  type="date"
                                  value={item.expiryDate}
                                  onChange={(e) => updateItem(item.productId, "expiryDate", e.target.value)}
                                  className="h-8 border-transparent focus:border-blue-200 bg-transparent text-center font-bold text-[10px] shadow-none p-0 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-2 text-right font-black text-slate-900 text-[10px] bg-slate-50/50 border-r border-slate-100">
                                {formatCurrency(item.quantity * item.unitCost)}
                              </td>
                              <td className="px-2 py-1 text-center">
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.productId)} className="h-7 w-7 text-slate-300 hover:text-red-500 rounded-lg">
                                  <LucideTrash2 className="h-3.5 w-3.5" />
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

          {/* Footer Bar */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center justify-between">
            <div className="flex gap-4 items-center flex-1 max-w-xl">
              <div className="flex-1 space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Notas de la compra</Label>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-medium focus:ring-2 focus:ring-blue-100 outline-none h-12 resize-none"
                  placeholder="Observaciones internas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-black uppercase text-[10px] px-6 h-10 rounded-xl text-slate-400">Cancelar</Button>
              <Button type="submit" disabled={loading || items.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] px-10 h-12 rounded-2xl shadow-xl shadow-blue-100 transition-all">
                {loading ? "Procesando..." : "Confirmar Orden de Compra"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
