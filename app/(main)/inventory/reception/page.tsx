import { Suspense } from "react";
import { getPendingReceptionsAction } from "@/lib/actions/receptions";
import { ReceptionView } from "@/components/inventory/reception-view";
import { LucideTruck, LucideInfo } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function ReceptionPage() {
  const pendingItems = await getPendingReceptionsAction();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-950">Recepciones</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1 w-12 bg-blue-800" />
            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
              Confirmación de ingreso de mercadería física
            </p>
          </div>
        </div>
      </div>

      <Alert className="rounded-none border-blue-100 bg-blue-50/50 shadow-none">
        <LucideInfo className="h-4 w-4 text-blue-800" />
        <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-blue-900">Modo Recepción Activo</AlertTitle>
        <AlertDescription className="text-[11px] font-medium text-blue-800/80">
          En este módulo, el personal de sede confirma la llegada de productos comprados centralmente. El stock impactará solo al confirmar la recepción aquí.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<div className="text-[10px] font-black uppercase animate-pulse">Cargando pendientes...</div>}>
        <ReceptionView pendingItems={pendingItems as any} />
      </Suspense>
    </div>
  );
}
