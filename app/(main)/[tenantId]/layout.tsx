import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<any>;
}) {
  const { tenantId } = (await params) as { tenantId: string };

  // Verify tenant exists
  const tenant = await db.query.tenants.findFirst({
    where: (tenants, { eq }) => eq(tenants.slug, tenantId),
  });

  if (!tenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">{tenant.name} - Admin</h1>
          {/* User Profile / Logout will go here */}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
