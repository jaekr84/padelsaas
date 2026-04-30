"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { 
  LucideTruck, 
  LucidePackage, 
  LucideCheckCircle2, 
  LucideAlertCircle,
  LucideClock,
  LucideArrowLeft,
  LucideChevronRight,
  LucideInfo,
  LucideHash,
  LucideUser,
  LucideCalendar,
  LucideSave,
  LucideScanBarcode,
  LucideSearch,
  LucideFilter,
  LucideX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { receiveItemsAction } from "@/lib/actions/receptions";
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface PendingItem {
  id: string;
  purchaseId: string;
  productId: string;
  centerId: string;
  quantity: number;
  receivedQuantity: number;
  status: string;
  purchase: {
    id: string;
    invoiceNumber: string | null;
    createdAt: Date;
    supplier: {
      name: string;
    } | null;
  };
  product: {
    id: string;
    name: string;
    sku: string | null;
  };
}

interface ReceptionViewProps {
  pendingItems: PendingItem[];
}

export function ReceptionView({ pendingItems: initialItems }: ReceptionViewProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [receptionQtys, setReceptionQtys] = useState<Record<string, number>>({});
  const [barcode, setBarcode] = useState("");
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  
  // Estados de Filtro
  const [filterType, setFilterType] = useState<"day" | "month" | "year" | "all">("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Agrupar ítems por Purchase y filtrar por fecha
  const filteredPurchases = useMemo(() => {
    const groups: Record<string, { 
      id: string, 
      invoiceNumber: string | null, 
      createdAt: Date, 
      supplierName: string,
      itemsCount: number,
      pendingCount: number,
      items: PendingItem[]
    }> = {};

    items.forEach(item => {
      const itemDate = new Date(item.purchase.createdAt);
      let matchesFilter = false;

      if (filterType === "day") {
        matchesFilter = isSameDay(itemDate, selectedDate);
      } else if (filterType === "month") {
        matchesFilter = itemDate.getMonth() === selectedDate.getMonth() && 
                        itemDate.getFullYear() === selectedDate.getFullYear();
      } else if (filterType === "year") {
        matchesFilter = itemDate.getFullYear() === selectedDate.getFullYear();
      } else {
        matchesFilter = true; // "all"
      }

      if (!matchesFilter) return;

      if (!groups[item.purchaseId]) {
        groups[item.purchaseId] = {
          id: item.purchaseId,
          invoiceNumber: item.purchase.invoiceNumber,
          createdAt: item.purchase.createdAt,
          supplierName: item.purchase.supplier?.name || "Desconocido",
          itemsCount: 0,
          pendingCount: 0,
          items: []
        };
      }
      groups[item.purchaseId].itemsCount++;
      groups[item.purchaseId].pendingCount += (item.quantity - item.receivedQuantity);
      groups[item.purchaseId].items.push(item);
    });

    return Object.values(groups).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, filterType, selectedDate]);

  const selectedPurchase = useMemo(() => {
    // Para la vista de detalle, buscamos en todos los ítems sin filtrar por fecha 
    // (por si el usuario entra a un detalle y luego cambia el filtro)
    const groups: Record<string, any> = {};
    items.forEach(item => {
        if (!groups[item.purchaseId]) {
            groups[item.purchaseId] = {
                id: item.purchaseId,
                invoiceNumber: item.purchase.invoiceNumber,
                createdAt: item.purchase.createdAt,
                supplierName: item.purchase.supplier?.name || "Desconocido",
                items: []
            };
        }
        groups[item.purchaseId].items.push(item);
    });
    return groups[selectedPurchaseId || ""];
  }, [items, selectedPurchaseId]);

  useEffect(() => {
    if (selectedPurchaseId && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [selectedPurchaseId]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim() || !selectedPurchase) return;

    const item = selectedPurchase.items.find((i: any) => 
      i.product.sku?.toLowerCase() === barcode.trim().toLowerCase()
    );

    if (!item) {
      toast.error(`Producto con SKU "${barcode}" no encontrado en este recibo`, {
        icon: <LucideAlertCircle className="h-4 w-4 text-red-500" />
      });
      setBarcode("");
      return;
    }

    const pendingTotal = item.quantity - item.receivedQuantity;
    const currentQty = receptionQtys[item.id] !== undefined ? receptionQtys[item.id] : 0;
    
    if (currentQty >= pendingTotal) {
      toast.warning(`Ya se alcanzó la cantidad comprada para ${item.product.name}`);
    } else {
      setReceptionQtys(prev => ({ ...prev, [item.id]: currentQty + 1 }));
      setLastScannedId(item.id);
      setTimeout(() => setLastScannedId(null), 1000);
    }

    setBarcode("");
  };

  const handleQtyChange = (itemId: string, val: string, max: number) => {
    const num = parseInt(val) || 0;
    if (num < 0) return;
    const safeQty = num > max ? max : num;
    setReceptionQtys(prev => ({ ...prev, [itemId]: safeQty }));
  };

  const handleSaveReception = async () => {
    if (!selectedPurchase) return;

    const itemsToReceive = selectedPurchase.items.map((item: any) => ({
      purchaseItemId: item.id,
      productId: item.productId,
      centerId: item.centerId,
      quantity: receptionQtys[item.id] !== undefined ? receptionQtys[item.id] : 0,
    })).filter((i: any) => i.quantity > 0);

    if (itemsToReceive.length === 0) {
      toast.error("No hay artículos escaneados o con cantidad mayor a 0");
      return;
    }

    setLoading(true);
    try {
      const response = await receiveItemsAction({
        purchaseId: selectedPurchase.id,
        items: itemsToReceive,
      });

      if (response.success) {
        toast.success(`Recepción procesada exitosamente`);
        
        const newItems = items.map(i => {
          const update = itemsToReceive.find((tr: any) => tr.purchaseItemId === i.id);
          if (update) {
            const newReceived = i.receivedQuantity + update.quantity;
            return {
              ...i,
              receivedQuantity: newReceived,
              status: newReceived >= i.quantity ? "received" : "partial"
            };
          }
          return i;
        }).filter(i => i.status !== "received");

        setItems(newItems);
        setSelectedPurchaseId(null);
        setReceptionQtys({});
        setBarcode("");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al procesar recepción");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 border-2 border-dashed border-slate-200 bg-slate-50/50">
        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
          <LucideCheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Todo al día</h3>
        <p className="text-[11px] font-medium text-slate-500 mt-1">No hay mercadería pendiente de recepción para esta sede.</p>
      </div>
    );
  }

  // --- VISTA DETALLE (PLANILLA TIPO EXCEL + SCANNER) ---
  if (selectedPurchaseId && selectedPurchase) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedPurchaseId(null);
                setReceptionQtys({});
                setBarcode("");
              }}
              className="h-10 w-10 p-0 rounded-none hover:bg-slate-100"
            >
              <LucideArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="rounded-none bg-blue-800 font-black uppercase text-[9px] tracking-widest px-2">
                   Modo Recepción Activo
                </Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  #{selectedPurchase.invoiceNumber || selectedPurchase.id.slice(0, 8)}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
                {selectedPurchase.supplierName}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden md:block mr-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fecha de Compra</p>
                <p className="text-xs font-black text-slate-950">{format(new Date(selectedPurchase.createdAt), "dd/MM/yyyy")}</p>
             </div>
             <Button 
                onClick={handleSaveReception}
                disabled={loading}
                className="h-12 bg-blue-800 hover:bg-blue-900 text-white rounded-none font-black uppercase tracking-[0.2em] text-[10px] px-8 gap-3 shadow-xl"
             >
                {loading ? "Procesando..." : <><LucideSave className="h-4 w-4" /> Confirmar Recepción</>}
             </Button>
          </div>
        </div>

        <div className="bg-slate-950 p-6 flex flex-col md:flex-row items-center gap-6 border-b-4 border-blue-600">
          <div className="flex items-center gap-4 shrink-0">
            <div className="h-12 w-12 bg-blue-600 flex items-center justify-center rounded-none shadow-lg shadow-blue-900/20">
              <LucideScanBarcode className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Lectora de Barras</p>
              <p className="text-white text-xs font-bold">Escanea para sumar unidades</p>
            </div>
          </div>
          <form onSubmit={handleBarcodeSubmit} className="flex-1 w-full relative">
            <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input 
              ref={barcodeInputRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="ESCANEAR SKU O CÓDIGO DE BARRAS..."
              className="h-14 w-full bg-slate-900 border-slate-800 text-white font-black uppercase tracking-widest text-sm pl-12 focus-visible:ring-blue-600 focus-visible:border-blue-600 rounded-none placeholder:text-slate-600"
            />
            <Button type="submit" className="hidden">Submit</Button>
          </form>
        </div>

        <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-950 text-left">Artículo / SKU</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-950 text-center w-32">Cant. Comprada</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-950 text-center w-32">Ya Recibido</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-800 text-center w-40 bg-blue-50/30">Cant. a Ingresar</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-950 text-center w-32">Pendiente Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedPurchase.items.map((item: any) => {
                const pendingTotal = item.quantity - item.receivedQuantity;
                const currentQty = receptionQtys[item.id] !== undefined ? receptionQtys[item.id] : 0;
                const finalPending = pendingTotal - currentQty;
                const isJustScanned = lastScannedId === item.id;

                return (
                  <tr key={item.id} className={`transition-all duration-300 h-16 ${isJustScanned ? "bg-blue-50 border-l-4 border-l-blue-600" : "hover:bg-slate-50/50"}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`font-black uppercase text-[11px] leading-tight mb-0.5 ${isJustScanned ? "text-blue-800" : "text-slate-950"}`}>
                          {item.product.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">{item.product.sku || "Sin SKU"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-500 text-xs tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs tabular-nums">
                      {item.receivedQuantity}
                    </td>
                    <td className="px-6 py-4 bg-blue-50/10">
                      <Input 
                        type="number"
                        min={0}
                        max={pendingTotal}
                        value={currentQty}
                        onChange={(e) => handleQtyChange(item.id, e.target.value, pendingTotal)}
                        className={`h-10 w-full rounded-none border-blue-200 bg-white font-black text-center text-xs tabular-nums focus-visible:ring-blue-800 focus-visible:border-blue-800 transition-all ${isJustScanned ? "ring-2 ring-blue-600" : ""}`}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                       <Badge variant="outline" className={`rounded-none font-black text-[10px] tabular-nums ${finalPending > 0 ? "text-orange-600 border-orange-200 bg-orange-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"}`}>
                          {finalPending > 0 ? `${finalPending} faltante` : "Listo para ingresar"}
                       </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- VISTA LISTADO (TABLE STYLE) ---
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* FILTROS SUPERIORES */}
      <div className="bg-white border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 flex items-center justify-center rounded-none">
            <LucideFilter className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Filtros de Fecha</p>
            <p className="text-xs font-bold text-slate-900">Buscador de Remitos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
            <SelectTrigger className="w-[140px] h-10 rounded-none border-slate-200 font-black uppercase text-[10px] tracking-widest focus:ring-blue-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-slate-200">
              <SelectItem value="day" className="text-[10px] font-black uppercase">Por Día</SelectItem>
              <SelectItem value="month" className="text-[10px] font-black uppercase">Por Mes</SelectItem>
              <SelectItem value="year" className="text-[10px] font-black uppercase">Por Año</SelectItem>
              <SelectItem value="all" className="text-[10px] font-black uppercase">Ver Todos</SelectItem>
            </SelectContent>
          </Select>

          {filterType !== "all" && (
            <div className="flex items-center gap-2">
              <Input 
                type={filterType === "day" ? "date" : filterType === "month" ? "month" : "number"}
                value={filterType === "day" ? format(selectedDate, "yyyy-MM-dd") : 
                       filterType === "month" ? format(selectedDate, "yyyy-MM") : 
                       selectedDate.getFullYear()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  if (filterType === "year") {
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(parseInt(val));
                    setSelectedDate(newDate);
                  } else {
                    setSelectedDate(new Date(val + (filterType === "month" ? "-01" : "")));
                  }
                }}
                className="h-10 rounded-none border-slate-200 font-black text-[10px] focus-visible:ring-blue-800"
              />
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => {
              setFilterType("day");
              setSelectedDate(new Date());
            }}
            className="h-10 rounded-none border-slate-200 px-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Recibo / Factura</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Proveedor</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Artículos</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Fecha Emisión</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center bg-slate-50/50">
                  <div className="flex flex-col items-center gap-3">
                    <LucideCalendar className="h-10 w-10 text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No hay remitos para la fecha seleccionada</p>
                    <Button 
                      variant="link" 
                      onClick={() => setFilterType("all")}
                      className="text-blue-800 font-black uppercase text-[9px]"
                    >
                      Ver todos los pendientes
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPurchases.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50 transition-all cursor-pointer" onClick={() => setSelectedPurchaseId(p.id)}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-950 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:bg-blue-600 transition-colors">
                        <LucideTruck className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-950 text-xs tracking-tighter uppercase">
                          #{p.invoiceNumber || p.id.slice(0, 8)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {p.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-black text-slate-700 uppercase tracking-tight">
                    {p.supplierName}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-black text-blue-800">{p.itemsCount}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tipos de Art.</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[11px] font-black text-slate-600 tabular-nums">
                      {format(new Date(p.createdAt), "dd MMM yyyy", { locale: es })}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-none group-hover:bg-blue-800 group-hover:text-white transition-colors">
                      <LucideChevronRight className="h-5 w-5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
