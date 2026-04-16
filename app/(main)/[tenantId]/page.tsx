import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TenantDashboard({
  params,
}: {
  params: Promise<any>;
}) {
  const { tenantId } = (await params) as { tenantId: string };
  const session = await auth();
  
  // For now, let's just show the dashboard if the user is authenticated
  // In a real app, we'd check if the user belongs to this tenant
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="font-semibold text-muted-foreground">Total Bookings</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="font-semibold text-muted-foreground">Courts</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="font-semibold text-muted-foreground">Players</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>
      
      <div className="p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center text-muted-foreground bg-card/50">
        <h2 className="text-xl font-medium text-foreground">Welcome to your Padel Admin</h2>
        <p className="max-w-md mt-2">
          Start by adding your first center and courts in the settings.
        </p>
      </div>
    </div>
  );
}
