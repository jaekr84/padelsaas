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
import { LucidePackage, LucideTag, LucideDollarSign, LucideBarcode, LucideCheck, LucidePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

  // Sincronizar initialName cuando se abre el modal
  useEffect(() => {
    if (open && initialName && !product) {
      setFormData(prev => ({ ...prev, name: initialName }));
    }
  }, [open, initialName, product]);

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            <LucidePackage className="h-5 w-5 text-emerald-600" />
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre del Producto</Label>
            <Input
              id="name"
              placeholder="Ej: Pelotas Head Pro S x3"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoría</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between font-bold"
                  >
                    {formData.categoryId && formData.categoryId !== "none"
                      ? categories.find((cat) => cat.id === formData.categoryId)?.name
                      : "Sin Categoría"}
                    <LucidePlus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                } />
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <LucideTag className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          placeholder="Buscar categoría..."
                          className="h-8 pl-8 text-xs font-medium"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, categoryId: "none" });
                          setCategoryOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs font-bold uppercase tracking-tight hover:bg-slate-100 rounded-md transition-colors"
                      >
                        Sin Categoría
                      </button>
                      {filteredCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, categoryId: cat.id });
                            setCategoryOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs font-bold uppercase tracking-tight hover:bg-slate-100 rounded-md transition-colors flex items-center justify-between"
                        >
                          {cat.name}
                          {formData.categoryId === cat.id && <LucideCheck className="h-3 w-3 text-emerald-600" />}
                        </button>
                      ))}
                      
                      {categorySearch && !categories.some(c => c.name.toLowerCase() === categorySearch.toLowerCase()) && (
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory}
                          className="w-full text-left px-2 py-2 text-xs font-black uppercase tracking-tight text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border-t border-emerald-100 mt-1 flex items-center gap-2"
                        >
                          <LucidePlus className="h-3 w-3" />
                          Crear "{categorySearch}"
                        </button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Código / SKU</Label>
              <div className="relative">
                <LucideBarcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="sku"
                  placeholder="Código de barras"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="pl-9 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="buyPrice" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Costo (Compra)</Label>
              <div className="relative">
                <LucideDollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="buyPrice"
                  type="number"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                  className="pl-9 font-bold"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sellPrice" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Precio Venta</Label>
              <div className="relative">
                <LucideDollarSign className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                <Input
                  id="sellPrice"
                  type="number"
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                  className="pl-9 font-bold text-emerald-700 bg-emerald-50/30"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="minStock" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stock Mínimo (Alerta)</Label>
            <Input
              id="minStock"
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
              className="font-bold"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="font-bold uppercase tracking-widest text-[10px]"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest text-[10px] min-w-[120px]"
            >
              {loading ? "Guardando..." : "Guardar Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
