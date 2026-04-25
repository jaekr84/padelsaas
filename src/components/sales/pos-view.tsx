"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  LucideCheck,
  LucideCalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { CustomerSelect } from "../customers/customer-select";

interface POSViewProps {
  products: any[];
  centers: any[];
  unpaidBookings: any[];
  terminals?: any[];
  paymentMethods?: any[];
}

export function POSView({ products, centers, unpaidBookings, terminals = [], paymentMethods = [] }: POSViewProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("Consumidor Final");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.name || "Efectivo");
  const [terminalId, setTerminalId] = useState(terminals[0]?.name || "Caja 1");
  const [centerId, setCenterId] = useState(centers[0]?.id || "");
  const [discount, setDiscount] = useState(0);
  const [charge, setCharge] = useState(0);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReservationsOpen, setIsReservationsOpen] = useState(false);
  const searchParams = useSearchParams();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mantener el foco en el buscador para escaneo rápido
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Manejar bookingId desde la URL
  useEffect(() => {
    const bookingId = searchParams.get("bookingId");
    if (bookingId && unpaidBookings.length > 0) {
      const booking = unpaidBookings.find(b => b.id === bookingId);
      if (booking) {
        addBookingToCart(booking);
      }
    }
  }, [searchParams, unpaidBookings]);

  const addBookingToCart = (booking: any) => {
    const bookingId = `BOOKING-${booking.id}`;
    const existing = cart.find(item => item.cartId === bookingId);
    
    if (!existing) {
      setCart([...cart, { 
        cartId: bookingId,
        id: booking.id, // Para el backend es el bookingId
        bookingId: booking.id,
        name: `RESERVA: ${booking.court?.name} - ${booking.guestName || booking.user?.name || "S/N"}`,
        sku: "RESERVA",
        quantity: 1, 
        price: Number(booking.price) || 0,
        isBooking: true
      }]);
      toast.success("Reserva añadida al carrito");
    } else {
      toast.error("Esta reserva ya está en el carrito");
    }
    setIsReservationsOpen(false);
  };

  const addToCart = (product: any) => {
    const cartId = `PROD-${product.id}`;
    const existing = cart.find(item => item.cartId === cartId);
    if (existing) {
      setCart(cart.map(item => 
        item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        cartId,
        id: product.id, 
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1, 
        price: Number(product.sellPrice) || 0 
      }]);
    }
    setSearch("");
    searchInputRef.current?.focus();
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
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
        customerId,
        paymentMethod,
        terminalId,
        centerId,
        subtotal,
        discount,
        charge,
        total,
        items: cart.map(item => ({
          productId: item.productId,
          bookingId: item.bookingId,
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
        setCustomerId(null);
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

        {/* Botones de Acceso Rápido / Reservas */}
        <div className="flex gap-4">
          <Dialog open={isReservationsOpen} onOpenChange={setIsReservationsOpen}>
            <DialogTrigger render={
              <Button className="h-16 flex-1 bg-white border border-slate-100 shadow-sm rounded-3xl text-slate-900 hover:bg-slate-50 transition-all gap-4">
                <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                  <LucideCalendarClock className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cobrar</p>
                  <p className="text-sm font-black uppercase">Próximas Reservas</p>
                </div>
                <div className="ml-auto bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500">
                  {unpaidBookings.length} PENDIENTES
                </div>
              </Button>
            } />
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                    <LucideCalendarClock className="h-6 w-6" />
                  </div>
                  Reservas Pendientes de Cobro
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-6 max-h-[400px] overflow-auto pr-2">
                {unpaidBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => addBookingToCart(booking)}
                    className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between transition-all group text-left"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-slate-900 uppercase text-sm tracking-tight">
                        {booking.court?.name} - {booking.guestName || booking.user?.name || "Sin nombre"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} HS
                        <span className="h-1 w-1 bg-slate-300 rounded-full" />
                        ID: {booking.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-blue-600 tracking-tighter">
                        {formatCurrency(booking.price)}
                      </p>
                      <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Añadir
                      </span>
                    </div>
                  </button>
                ))}
                {unpaidBookings.length === 0 && (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No hay reservas pendientes de pago para hoy
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button className="h-16 flex-1 bg-white border border-slate-100 shadow-sm rounded-3xl text-slate-900 hover:bg-slate-50 transition-all gap-4 opacity-50 cursor-not-allowed">
            <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <LucideShoppingCart className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acceso</p>
              <p className="text-sm font-black uppercase">Otros Servicios</p>
            </div>
          </Button>
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
                    <tr key={item.cartId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-black uppercase text-sm tracking-tight",
                            item.isBooking ? "text-blue-600" : "text-slate-700"
                          )}>{item.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.sku}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.cartId, -1)}
                            disabled={item.isBooking}
                            className={cn(
                              "h-8 w-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 transition-all",
                              item.isBooking ? "opacity-30 cursor-not-allowed" : "hover:bg-white hover:text-red-500 hover:shadow-md"
                            )}
                          >
                            <LucideMinus className="h-3 w-3" />
                          </button>
                          <span className="font-black text-slate-900 text-lg w-8 text-center tracking-tighter">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.cartId, 1)}
                            disabled={item.isBooking}
                            className={cn(
                              "h-8 w-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 transition-all",
                              item.isBooking ? "opacity-30 cursor-not-allowed" : "hover:bg-white hover:text-blue-600 hover:shadow-md"
                            )}
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
                          onClick={() => removeFromCart(item.cartId)}
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
                <CustomerSelect 
                  defaultValue={customerId || ""}
                  onSelect={(customer) => {
                    setCustomerId(customer.id);
                    setCustomerName(`${customer.firstName} ${customer.lastName}`);
                  }}
                  className="bg-transparent border-none p-0 focus-visible:ring-0 font-black text-lg h-8 uppercase tracking-tight shadow-none hover:bg-slate-50 transition-colors"
                  placeholder={customerName}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Terminal</label>
                <Select value={terminalId} onValueChange={(val: string | null) => val && setTerminalId(val)}>
                  <SelectTrigger className="rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest h-10">
                    <SelectValue placeholder="Terminal" />
                  </SelectTrigger>
                  <SelectContent>
                    {terminals.length > 0 ? (
                      terminals.map(t => (
                        <SelectItem key={t.id} value={t.name} className="font-bold uppercase text-[10px] tracking-widest">
                          {t.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Caja 1" className="font-bold uppercase text-[10px] tracking-widest">Caja 1</SelectItem>
                        <SelectItem value="Móvil 1" className="font-bold uppercase text-[10px] tracking-widest">Móvil 1</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Medio de Pago</label>
                <Select value={paymentMethod} onValueChange={(val: string | null) => val && setPaymentMethod(val)}>
                  <SelectTrigger className="rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest h-10">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.length > 0 ? (
                      paymentMethods.map(pm => (
                        <SelectItem key={pm.id} value={pm.name} className="font-bold uppercase text-[10px] tracking-widest">
                          {pm.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Efectivo" className="font-bold uppercase text-[10px] tracking-widest">Efectivo</SelectItem>
                        <SelectItem value="Tarjeta" className="font-bold uppercase text-[10px] tracking-widest">Tarjeta</SelectItem>
                        <SelectItem value="Transferencia" className="font-bold uppercase text-[10px] tracking-widest">Transferencia</SelectItem>
                      </>
                    )}
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
