import { getCentersAction } from "@/lib/actions/center";
import { getTenantAction } from "@/lib/actions/tenant";
import { SettingsForm } from "@/components/settings-form";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage(props: {
  params?: Promise<any>;
  searchParams?: Promise<any>;
}) {
  const session = await auth();
  
  // Protect route
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/home");
  }

  const centers = await getCentersAction();
  const tenant = await getTenantAction();
  
  // Obtener configuraciones de POS
  const { data: terminals = [] } = await import("@/lib/actions/settings").then(m => m.getTerminalsAction());
  const { data: paymentMethods = [] } = await import("@/lib/actions/settings").then(m => m.getPaymentMethodsAction());

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto py-6">
      <SettingsForm 
        initialCenters={centers} 
        initialTenant={tenant} 
        initialTerminals={terminals}
        initialPaymentMethods={paymentMethods}
      />
    </div>
  );
}
