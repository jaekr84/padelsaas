import { getCustomersAction } from "@/lib/actions/customer";
import { CustomersList } from "../../../src/components/customers/customers-list";
import { LucideUsers, LucideUserPlus } from "lucide-react";
import { CreateCustomerModal } from "@/components/customers/create-customer-modal";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const result = await getCustomersAction();
  const customers = result.success ? result.data : [];

  return (
    <div className="flex-1 bg-slate-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <LucideUsers className="w-6 h-6" />
              </div>
              CRM de Clientes
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Gestiona la base de datos de tus jugadores y clientes</p>
          </div>

          <CreateCustomerModal />
        </div>

        <CustomersList initialCustomers={customers || []} />
      </div>
    </div>
  );
}
