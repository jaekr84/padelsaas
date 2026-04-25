"use client";

import { useState, useRef, useEffect } from "react";
import { 
  LucideScanBarcode, 
  LucideUser, 
  LucideTrash2, 
  LucideCreditCard, 
  LucideBanknote, 
  LucideLaptop, 
  LucidePlus, 
  LucideMinus,
  LucideShoppingCart,
  LucideCircleDollarSign,
  LucidePercent,
  LucideBadgePercent,
  LucideCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createSaleAction } from "@/lib/actions/sales";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";

interface POSViewProps {
  products: any[];
  centers: any[];
}

export function POSView({ products, centers }: POSViewProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("Consumidor Final");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [terminalId, setTerminalId] = useState("Caja 1");
  const [centerId, setCenterId] = useState(centers[0]?.id || "");
  const [discount, setDiscount] = useState(0);
  const [charge, setCharge] = useState(0);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mantener el foco en el buscador para escaneo rápido
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1, 
        price: Number(product.sellPrice) || 0 
      }]);
    }
    setSearch("");
    searchInputRef.current?.focus();
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal - discount + charge;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createSaleAction({
        customerName,
        paymentMethod,
        terminalId,
        centerId,
        subtotal,
        discount,
        charge,
        total,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        }))
      });

      if (result.success) {
        // @ts-ignore - result is narrowed by success but TS might be picky with the union inference here
        toast.success(`Venta ${result.saleNumber} realizada con éxito`);
        setCart([]);
        setDiscount(0);
        setCharge(0);
        setCustomerName("Consumidor Final");
      } else {
        // @ts-ignore
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al procesar la venta");
    } finally {
      setIsProcessing(false);
      searchInputRef.current?.focus();
    }
  };

  // Filtrar productos por nombre o código de barras
  const filteredProducts = search.length > 1 
    ? products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search)
      ).slice(0, 5)
    : [];

  // Manejar el "Enter" en el buscador (para lectores de barras que mandan Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredProducts.length > 0) {
      addToCart(filteredProducts[0]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-6 animate-in fade-in duration-500">
      {/* Columna Izquierda: Carrito y Búsqueda */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Buscador Premium */}
        <div className="relative">
          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-4 group">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
              <LucideScanBarcode className="h-6 w-6" />
            </div>
            <div className="flex-1 relative">
              <Input 
                ref={searchInputRef}
                placeholder="ESCANEAR CÓDIGO O BUSCAR PRODUCTO..."
                className="border-none bg-transparent focus-visible:ring-0 text-xl font-black uppercase tracking-tight placeholder:text-slate-300 h-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              
              {/* Resultados de búsqueda rápidos */}
              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-black text-slate-800 uppercase text-sm">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SKU: {p.sku || "---"} | Stock: {p.stock}</span>
                      </div>
                      <span className="font-black text-blue-600 text-lg tracking-tighter">{formatCurrency(p.sellPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de Items (Excel-Style) */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400 flex items-center gap-2">
              <LucideShoppingCart className="h-4 w-4" />
              Detalle de Venta
            </h3>
            <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-slate-400 border border-slate-100">
              {cart.length} ARTÍCULOS
            </span>
          </div>
          
          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-30">
                <LucideShoppingCart className="h-24 w-24 mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">Escanea un producto para comenzar</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Producto</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Cantidad</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Unitario</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Subtotal</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cart.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-700 uppercase text-sm tracking-tight">{item.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SKU: {item.sku}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-md transition-all"
                          >
                            <LucideMinus className="h-3 w-3" />
                          </button>
                          <span className="font-black text-slate-900 text-lg w-8 text-center tracking-tighter">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-md transition-all"
                          >
                            <LucidePlus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="font-bold text-slate-500 text-sm">{formatCurrency(item.price)}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="font-black text-slate-900 text-lg tracking-tighter">{formatCurrency(item.price * item.quantity)}</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="h-10 w-10 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center mx-auto"
                        >
                          <LucideTrash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Panel de Control de Pago */}
      <div className="w-[450px] flex flex-col gap-6">
        {/* Configuración de Venta */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <LucideUser className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Cliente</label>
                <Input 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-transparent border-none p-0 focus-visible:ring-0 font-black text-lg h-6 uppercase tracking-tight"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Terminal</label>
                <Select value={terminalId} onValueChange={(val) => val && setTerminalId(val)}>
                  <SelectTrigger className="bg-transparent border-none p-0 h-auto focus:ring-0 font-black text-slate-800 uppercase tracking-tighter">
                    <div className="flex items-center gap-2">
                      <LucideLaptop className="h-4 w-4 text-blue-500" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="Caja 1" className="rounded-xl font-bold uppercase text-[10px]">Caja 1</SelectItem>
                    <SelectItem value="Caja 2" className="rounded-xl font-bold uppercase text-[10px]">Caja 2</SelectItem>
                    <SelectItem value="Móvil 1" className="rounded-xl font-bold uppercase text-[10px]">Móvil 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Medio de Pago</label>
                <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
                  <SelectTrigger className="bg-transparent border-none p-0 h-auto focus:ring-0 font-black text-slate-800 uppercase tracking-tighter">
                    <div className="flex items-center gap-2">
                      {paymentMethod === "Efectivo" ? <LucideBanknote className="h-4 w-4 text-emerald-500" /> : <LucideCreditCard className="h-4 w-4 text-blue-500" />}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="Efectivo" className="rounded-xl font-bold uppercase text-[10px]">Efectivo</SelectItem>
                    <SelectItem value="Débito" className="rounded-xl font-bold uppercase text-[10px]">Débito</SelectItem>
                    <SelectItem value="Crédito" className="rounded-xl font-bold uppercase text-[10px]">Crédito</SelectItem>
                    <SelectItem value="Transferencia" className="rounded-xl font-bold uppercase text-[10px]">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <hr className="border-slate-50" />

          {/* Recargos y Descuentos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                  <LucideBadgePercent className="h-5 w-5" />
                </div>
                <span className="font-black uppercase tracking-widest text-[10px] text-slate-500">Descuento</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 focus-within:border-red-200 transition-colors">
                <span className="text-slate-400 font-black text-sm">$</span>
                <input 
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="bg-transparent border-none w-20 text-right focus:outline-none font-black text-slate-800 tracking-tighter"
                />
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                  <LucidePlus className="h-5 w-5" />
                </div>
                <span className="font-black uppercase tracking-widest text-[10px] text-slate-500">Recargo</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 focus-within:border-blue-200 transition-colors">
                <span className="text-slate-400 font-black text-sm">$</span>
                <input 
                  type="number"
                  value={charge}
                  onChange={(e) => setCharge(Number(e.target.value))}
                  className="bg-transparent border-none w-20 text-right focus:outline-none font-black text-slate-800 tracking-tighter"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-6 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden">
            <LucideCircleDollarSign className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 rotate-12" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Total a Cobrar</p>
              <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(total)}</h2>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Listo para procesar</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCheckout}
            disabled={isProcessing || cart.length === 0}
            className="w-full h-20 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black uppercase tracking-[0.2em] text-sm rounded-[2rem] shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col gap-1"
          >
            {isProcessing ? "Procesando..." : (
              <>
                <span className="flex items-center gap-2">
                  <LucideCheck className="h-5 w-5" />
                  Confirmar Venta
                </span>
                <span className="text-[9px] opacity-60 tracking-widest">PRESIONE ENTER O CLICK</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
