import { getSalesAction } from "@/lib/actions/sales";
import { SalesList } from "@/components/sales/sales-list";
import { LucideArrowLeft, LucideHistory } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SalesHistoryPage() {
  const result = await getSalesAction();
  const sales = result.success ? result.data : [];

  return (
    <div className="flex-1 bg-slate-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/sales">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-sm hover:bg-slate-50 transition-all border-slate-200">
                <LucideArrowLeft className="w-5 h-5 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <LucideHistory className="w-6 h-6 text-blue-600" />
                Historial de Ventas
              </h1>
              <p className="text-slate-500 text-sm">Gestiona y revisa todas las transacciones realizadas</p>
            </div>
          </div>
          
          <Link href="/sales">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all font-medium">
              Nueva Venta
            </Button>
          </Link>
        </div>

        <SalesList sales={sales || []} />
      </div>
    </div>
  );
}
