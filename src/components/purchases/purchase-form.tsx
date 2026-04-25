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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addPurchaseAction, addSupplierAction } from "@/lib/actions/purchases";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [items, setItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([]);
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
      setItems([...items, { productId: product.id, quantity: 1, unitCost: product.buyPrice || 0 }]);
    }
    setProductSearch("");
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const updateItem = (productId: string, field: "quantity" | "unitCost", value: number) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
          <LucideShoppingCart className="absolute -right-8 -bottom-8 h-40 w-40 opacity-10 rotate-12" />
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <LucideShoppingCart className="h-8 w-8" />
              Nueva Orden de Compra
            </DialogTitle>
          </DialogHeader>
          <p className="text-blue-100 font-bold uppercase tracking-widest text-[10px] mt-2 opacity-80">
            Completa los datos de la mercadería ingresante
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Supplier Select (Creatable) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <LucideTruck className="h-3 w-3" /> Proveedor
              </Label>
              <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                <PopoverTrigger render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={supplierOpen}
                    className="w-full justify-between font-bold border-slate-200 rounded-xl h-11 bg-slate-50/50"
                  >
                    {supplierId && supplierId !== "none"
                      ? suppliers.find((s) => s.id === supplierId)?.name
                      : "Sin Proveedor (Final)"}
                    <LucidePlus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                } />
                <PopoverContent className="w-[240px] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <LucideSearch className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          placeholder="Buscar proveedor..."
                          className="h-8 pl-8 text-xs font-medium"
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSupplierId("none");
                          setSupplierOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs font-bold uppercase tracking-tight hover:bg-slate-100 rounded-md transition-colors"
                      >
                        Sin Proveedor (Final)
                      </button>
                      {filteredSuppliers.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSupplierId(s.id);
                            setSupplierOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs font-bold uppercase tracking-tight hover:bg-slate-100 rounded-md transition-colors flex items-center justify-between"
                        >
                          {s.name}
                          {supplierId === s.id && <LucideCheck className="h-3 w-3 text-blue-600" />}
                        </button>
                      ))}
                      
                      {supplierSearch && !suppliers.some(s => s.name.toLowerCase() === supplierSearch.toLowerCase()) && (
                        <button
                          type="button"
                          onClick={handleCreateSupplier}
                          disabled={isCreatingSupplier}
                          className="w-full text-left px-2 py-2 text-xs font-black uppercase tracking-tight text-blue-600 hover:bg-blue-50 rounded-md transition-colors border-t border-blue-100 mt-1 flex items-center gap-2"
                        >
                          <LucidePlus className="h-3 w-3" />
                          Crear "{supplierSearch}"
                        </button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Center Select (Refactored) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                Sede / Depósito
              </Label>
              <Popover open={centerOpen} onOpenChange={setCenterOpen}>
                <PopoverTrigger render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={centerOpen}
                    className="w-full justify-between font-bold border-slate-200 rounded-xl h-11 bg-slate-50/50"
                  >
                    {centerId 
                      ? centers.find((c) => c.id === centerId)?.name 
                      : "Seleccionar Sede"}
                    <LucidePlus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                } />
                <PopoverContent className="w-[240px] p-0" align="start">
                  <div className="flex flex-col p-1">
                    {centers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCenterId(c.id);
                          setCenterOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-tight hover:bg-slate-100 rounded-md transition-colors flex items-center justify-between"
                      >
                        {c.name}
                        {centerId === c.id && <LucideCheck className="h-3 w-3 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <LucideHash className="h-3 w-3" /> Nro de Factura
              </Label>
              <Input
                placeholder="Ej: 0001-00001234"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="font-bold border-slate-200 rounded-xl h-11 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Product Search */}
          <div className="space-y-3 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Buscar Productos</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Escanea el código o escribe el nombre del producto..."
                  className="pl-12 h-14 bg-slate-100 border-none rounded-2xl font-bold text-lg shadow-inner w-full"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addItem(p)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <LucidePackage className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-700 uppercase tracking-tight">{p.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku || "Sin SKU"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-blue-600">{formatCurrency(p.buyPrice)}</span>
                          <LucidePlus className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                        </div>
                      </button>
                    ))}
                    
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => onCreateProduct(productSearch)}
                        className="w-full text-left px-4 py-4 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-3 border-t border-emerald-50 mt-1"
                      >
                        <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <LucidePlus className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-emerald-700 uppercase tracking-tight text-xs">¿Producto Nuevo?</span>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Crear "{productSearch}"</span>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={() => onCreateProduct(productSearch)}
                className="h-14 px-6 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-none rounded-2xl font-black uppercase tracking-widest text-[10px] flex flex-col items-center justify-center gap-1 min-w-[100px]"
              >
                <LucidePlus className="h-5 w-5" />
                Producto
              </Button>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-slate-50 rounded-3xl p-6 min-h-[200px]">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 italic">
                <LucidePackage className="h-12 w-12 opacity-10 mb-2" />
                <p className="text-xs uppercase font-black tracking-widest opacity-40">No hay productos agregados</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-4 px-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <div className="col-span-5 text-left">Producto</div>
                  <div className="col-span-2 text-center">Cant.</div>
                  <div className="col-span-2 text-center">Costo Unit.</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="space-y-2">
                  {items.map((item) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={item.productId} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                        <div className="col-span-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-700 uppercase tracking-tight text-xs truncate">
                              {product?.name}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">
                              SKU: {product?.sku || "---"}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.productId, "quantity", parseInt(e.target.value) || 0)}
                            className="text-center font-black h-9 rounded-lg border-slate-100 bg-slate-50"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <LucideDollarSign className="absolute left-2 top-2.5 h-3 w-3 text-slate-400" />
                            <Input
                              type="number"
                              value={item.unitCost}
                              onChange={(e) => updateItem(item.productId, "unitCost", parseInt(e.target.value) || 0)}
                              className="pl-6 text-center font-black h-9 rounded-lg border-slate-100 bg-slate-50"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="font-black text-slate-900 text-sm">
                            {formatCurrency(item.quantity * item.unitCost)}
                          </span>
                        </div>
                        <div className="col-span-1 text-right">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeItem(item.productId)}
                            className="h-8 w-8 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <LucideTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between pt-4">
            <div className="flex flex-col gap-2 w-full md:w-1/2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notas u Observaciones</Label>
               <textarea
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none h-24 resize-none"
                 placeholder="Ej: Recibido por Juan. Caja nro 4..."
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
               />
            </div>

            <div className="flex flex-col items-end gap-1 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total a Pagar</span>
              <span className="text-5xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-50">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="font-black uppercase tracking-widest text-xs px-8 h-12 rounded-2xl text-slate-400"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || items.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-12 h-14 shadow-blue-100 shadow-2xl rounded-2xl transition-all"
            >
              {loading ? "Procesando..." : "Confirmar Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
