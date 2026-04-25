
import { getCustomersAction } from "@/lib/actions/customer";
import { CustomersList } from "../../../src/components/customers/customers-list";
import { LucideUsers } from "lucide-react";
import { CreateCustomerModal } from "@/components/customers/create-customer-modal";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const result = await getCustomersAction();
  const customers = result.success ? result.data : [];

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* 1. Technical Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-6 bg-blue-800" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-800">Directorio de Entidades</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">CRM de Clientes</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Administración centralizada de jugadores y cuentas corporativas</p>
        </div>

        <CreateCustomerModal />
      </div>

      {/* 2. Main List Content */}
      <div className="max-w-[1600px] mx-auto">
        <CustomersList initialCustomers={customers || []} />
      </div>
    </div>
  );
}
