"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addProductAction, updateProductAction, addProductCategoryAction } from "@/lib/actions/products";
import { toast } from "sonner";
import { LucidePackage, LucideTag, LucideDollarSign, LucideBarcode, LucideCheck, LucidePlus, LucideShieldCheck, LucideCoins, LucideBox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  categories: any[];
  centers?: any[];
  initialName?: string;
}

export function ProductForm({ open, onOpenChange, product, categories, initialName }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || initialName || "",
    description: product?.description || "",
    sku: product?.sku || "",
    buyPrice: product?.buyPrice || 0,
    sellPrice: product?.sellPrice || 0,
    categoryId: product?.categoryId || "none",
    minStock: product?.minStock || 0,
  });

  const [categorySearch, setCategorySearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        name: product?.name || initialName || "",
        description: product?.description || "",
        sku: product?.sku || "",
        buyPrice: product?.buyPrice || 0,
        sellPrice: product?.sellPrice || 0,
        categoryId: product?.categoryId || "none",
        minStock: product?.minStock || 0,
      });
    }
  }, [open, product, initialName]);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleCreateCategory = async () => {
    if (!categorySearch) return;
    setIsCreatingCategory(true);
    try {
      const newCat = await addProductCategoryAction(categorySearch);
      setFormData({ ...formData, categoryId: newCat.id });
      setCategoryOpen(false);
      setCategorySearch("");
      toast.success(`Categoría "${categorySearch}" creada`);
    } catch (error) {
      toast.error("Error al crear categoría");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        categoryId: formData.categoryId === "none" ? null : formData.categoryId,
        buyPrice: Number(formData.buyPrice),
        sellPrice: Number(formData.sellPrice),
        minStock: Number(formData.minStock),
      };

      if (product) {
        await updateProductAction(product.id, data);
        toast.success("Producto actualizado correctamente");
      } else {
        await addProductAction(data);
        toast.success("Producto creado correctamente");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-none border border-slate-200 shadow-2xl p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="bg-slate-950 p-8 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-4 bg-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Control de Existencias</span>
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">
                {product ? "Modificación de Activo" : "Alta de Artículo"}
            </DialogTitle>
          </div>
          <div className="h-12 w-12 bg-white/5 border border-white/10 flex items-center justify-center text-blue-500">
             <LucidePackage className="h-6 w-6" />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid gap-6">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[9px] font-black uppercase tracking-widest text-slate-500">Identificación del Producto</Label>
              <div className="relative">
                <LucideBox className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  placeholder="NOMBRE DEL ARTÍCULO"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-bold uppercase text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Categoría */}
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Categorización</Label>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryOpen}
                      className="w-full h-12 justify-between bg-slate-50 border-slate-200 rounded-none font-bold uppercase text-[10px] tracking-widest"
                    >
                      {formData.categoryId && formData.categoryId !== "none"
                        ? categories.find((cat) => cat.id === formData.categoryId)?.name
                        : "SIN CATEGORÍA"}
                      <LucidePlus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  } />
                  <PopoverContent className="w-[250px] p-0 rounded-none border-slate-200 shadow-xl" align="start">
                    <div className="flex flex-col">
                      <div className="p-3 border-b bg-slate-50">
                        <div className="relative">
                          <LucideTag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <Input
                            placeholder="FILTRAR..."
                            className="h-9 pl-9 text-[10px] font-black uppercase tracking-widest bg-white border-slate-200 rounded-none focus-visible:ring-0"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-1 bg-white">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, categoryId: "none" });
                            setCategoryOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 hover:text-white transition-colors"
                        >
                          SIN CATEGORÍA
                        </button>
                        {filteredCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, categoryId: cat.id });
                              setCategoryOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 hover:text-white transition-colors flex items-center justify-between"
                          >
                            {cat.name}
                            {formData.categoryId === cat.id && <LucideCheck className="h-3 w-3" />}
                          </button>
                        ))}
                        
                        {categorySearch && !categories.some(c => c.name.toLowerCase() === categorySearch.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={isCreatingCategory}
                            className="w-full text-left px-3 py-3 text-[10px] font-black uppercase tracking-widest text-blue-800 hover:bg-blue-50 border-t border-slate-100 mt-1 flex items-center gap-2"
                          >
                            <LucidePlus className="h-3 w-3" />
                            CREAR "{categorySearch}"
                          </button>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cód. Almacén / SKU</Label>
                <div className="relative">
                  <LucideBarcode className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="sku"
                    placeholder="COD-BAR"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-mono text-[10px] tracking-[0.2em]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Buy Price */}
              <div className="space-y-2">
                <Label htmlFor="buyPrice" className="text-[9px] font-black uppercase tracking-widest text-slate-500">Costo Unitario (Compra)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">$</span>
                  <Input
                    id="buyPrice"
                    type="number"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                    className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-black tabular-nums text-xs"
                  />
                </div>
              </div>

              {/* Sell Price */}
              <div className="space-y-2">
                <Label htmlFor="sellPrice" className="text-[9px] font-black uppercase tracking-widest text-slate-500">Precio de Venta</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-800">$</span>
                  <Input
                    id="sellPrice"
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                    className="pl-10 h-12 bg-blue-50/30 border-blue-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-black text-blue-900 tabular-nums text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Min Stock */}
            <div className="space-y-2">
              <Label htmlFor="minStock" className="text-[9px] font-black uppercase tracking-widest text-slate-500">Umbral de Stock Mínimo</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                className="h-12 bg-slate-50 border-slate-200 rounded-none focus-visible:ring-0 focus-visible:border-blue-800 transition-all font-black tabular-nums text-xs"
              />
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic">Se activará una alerta visual cuando las existencias sean inferiores a este valor.</p>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-none font-black uppercase text-[10px] tracking-widest border-slate-200 h-12 px-8 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-800 hover:bg-blue-900 text-white rounded-none px-10 h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-none"
            >
              {loading ? "Sincronizando..." : "Guardar Registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
