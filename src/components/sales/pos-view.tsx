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
    <div className="flex h-[calc(100vh-80px)] gap-4 p-4 animate-in fade-in duration-500">
      {/* Columna Izquierda: Carrito y Búsqueda */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Buscador Premium */}
        <div className="relative">
          <div className="bg-white border border-slate-200 flex items-center gap-0 group">
            <div className="h-14 w-14 bg-slate-950 flex items-center justify-center text-white shrink-0">
              <LucideScanBarcode className="h-6 w-6" />
            </div>
            <div className="flex-1 relative">
              <Input 
                ref={searchInputRef}
                placeholder="ESCANEAR CÓDIGO O BUSCAR PRODUCTO..."
                className="border-none bg-transparent focus-visible:ring-0 text-lg font-bold uppercase tracking-tight placeholder:text-slate-300 h-14 px-6"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              
              {/* Resultados de búsqueda rápidos */}
              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl z-50">
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

        <div className="flex gap-4">
          <Dialog open={isReservationsOpen} onOpenChange={setIsReservationsOpen}>
            <DialogTrigger render={
              <Button className="h-14 flex-1 bg-white border border-slate-200 rounded-none text-slate-900 hover:bg-slate-50 transition-all gap-4">
                <div className="h-10 w-10 bg-slate-100 flex items-center justify-center text-slate-900">
                  <LucideCalendarClock className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Acceso</p>
                  <p className="text-xs font-bold uppercase">Reservas Pendientes</p>
                </div>
                <div className="ml-auto bg-slate-950 px-3 py-1 text-[9px] font-bold text-white">
                  {unpaidBookings.length}
                </div>
              </Button>
            } />
            <DialogContent className="sm:max-w-[600px] rounded-none border-slate-200 shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="p-8 border-b border-slate-100 bg-slate-50/50">
                <DialogTitle className="text-xl font-bold uppercase tracking-tight text-slate-950 flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-950 flex items-center justify-center text-white">
                    <LucideCalendarClock className="h-5 w-5" />
                  </div>
                  Terminal de Reservas
                </DialogTitle>
              </DialogHeader>
              <div className="p-8 space-y-px bg-slate-100">
                {unpaidBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => addBookingToCart(booking)}
                    className="w-full p-6 bg-white hover:bg-slate-50 border-none flex items-center justify-between transition-all group text-left"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-950 uppercase text-xs tracking-tight">
                        {booking.court?.name} - {booking.guestName || booking.user?.name || "Sin nombre"}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} HS • ID: {booking.id.slice(0, 8)}
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

          <Button className="h-14 flex-1 bg-white border border-slate-200 rounded-none text-slate-900 hover:bg-slate-50 transition-all gap-4 opacity-50 cursor-not-allowed">
            <div className="h-10 w-10 bg-slate-100 flex items-center justify-center text-slate-400">
              <LucideShoppingCart className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Acceso</p>
              <p className="text-xs font-bold uppercase">Servicios Varios</p>
            </div>
          </Button>
        </div>

        {/* Tabla de Items (Industrial Style) */}
        <div className="flex-1 bg-white border border-slate-200 rounded-none overflow-hidden flex flex-col">
          <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold uppercase tracking-widest text-[10px] text-slate-500 flex items-center gap-2">
              <LucideShoppingCart className="h-4 w-4" />
              Detalle de Comprobante
            </h3>
            <span className="font-mono text-[10px] font-bold text-slate-950 uppercase border-l border-slate-200 pl-4">
              Items: {cart.length}
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
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 border-r border-slate-100">Producto</th>
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center border-r border-slate-100">Cant.</th>
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right border-r border-slate-100">P. Unit</th>
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Subtotal</th>
                    <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cart.map((item) => (
                    <tr key={item.cartId} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3 border-r border-slate-50">
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-bold uppercase text-xs tracking-tight",
                            item.isBooking ? "text-blue-800" : "text-slate-950"
                          )}>{item.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">{item.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 border-r border-slate-50">
                        <div className="flex items-center justify-center gap-4">
                          <button 
                            onClick={() => updateQuantity(item.cartId, -1)}
                            disabled={item.isBooking}
                            className={cn(
                              "h-7 w-7 border border-slate-200 flex items-center justify-center text-slate-400 transition-all",
                              item.isBooking ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-950 hover:text-white"
                            )}
                          >
                            <LucideMinus className="h-3 w-3" />
                          </button>
                          <span className="font-bold text-slate-950 text-sm w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.cartId, 1)}
                            disabled={item.isBooking}
                            className={cn(
                              "h-7 w-7 border border-slate-200 flex items-center justify-center text-slate-400 transition-all",
                              item.isBooking ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-950 hover:text-white"
                            )}
                          >
                            <LucidePlus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right border-r border-slate-50">
                        <span className="font-bold text-slate-400 text-xs">{formatCurrency(item.price)}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="font-bold text-slate-950 text-base tracking-tight">{formatCurrency(item.price * item.quantity)}</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <button 
                          onClick={() => removeFromCart(item.cartId)}
                          className="h-10 w-10 text-slate-200 hover:text-slate-950 transition-all flex items-center justify-center mx-auto"
                        >
                          <LucideTrash2 className="h-4 w-4" />
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
      <div className="w-[380px] flex flex-col">
        {/* Configuración de Venta */}
        <div className="bg-white p-6 border border-slate-200 flex flex-col flex-1">
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-slate-950">
              <div className="h-12 w-12 bg-slate-950 flex items-center justify-center text-white">
                <LucideUser className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Cliente / Titular</label>
                <CustomerSelect 
                  defaultValue={customerId || ""}
                  onSelect={(customer) => {
                    setCustomerId(customer.id);
                    setCustomerName(`${customer.firstName} ${customer.lastName}`);
                  }}
                  className="bg-transparent border-none p-0 focus-visible:ring-0 font-bold text-lg h-8 uppercase tracking-tight shadow-none hover:bg-slate-50 transition-colors"
                  placeholder={customerName}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200">
              <div className="bg-white p-4">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Terminal</label>
                <Select value={terminalId} onValueChange={(val: string | null) => val && setTerminalId(val)}>
                  <SelectTrigger className="rounded-none border-slate-200 font-bold uppercase text-[10px] tracking-widest h-10">
                    <SelectValue placeholder="Terminal" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
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

              <div className="bg-white p-4">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Medio de Pago</label>
                <Select value={paymentMethod} onValueChange={(val: string | null) => val && setPaymentMethod(val)}>
                  <SelectTrigger className="rounded-none border-slate-200 font-bold uppercase text-[10px] tracking-widest h-10">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
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
          
          {/* Spacer to push total to bottom */}
          <div className="flex-1" />

          <hr className="border-slate-50" />

          {/* Recargos y Descuentos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold uppercase tracking-widest text-[9px] text-slate-500">Descuento Global</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-xs">$</span>
                <input 
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="bg-transparent border-none w-20 text-right focus:outline-none font-bold text-slate-950 tracking-tight"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold uppercase tracking-widest text-[9px] text-slate-500">Recargos / Tax</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-xs">$</span>
                <input 
                  type="number"
                  value={charge}
                  onChange={(e) => setCharge(Number(e.target.value))}
                  className="bg-transparent border-none w-20 text-right focus:outline-none font-bold text-slate-950 tracking-tight"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-8 bg-slate-950 text-white relative border-t-4 border-blue-800">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">Total Comprobante</p>
                <h2 className="text-5xl font-bold tracking-tighter">{formatCurrency(total)}</h2>
              </div>
              <div className="text-right">
                <div className="h-2 w-2 bg-blue-500 ml-auto animate-pulse" />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCheckout}
            disabled={isProcessing || cart.length === 0}
            className="w-full h-16 bg-blue-800 hover:bg-blue-900 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold uppercase tracking-[0.2em] text-xs rounded-none transition-all flex items-center justify-center gap-3"
          >
            {isProcessing ? "Procesando..." : (
              <>
                <LucideCheck className="h-4 w-4" />
                Confirmar Operación
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
