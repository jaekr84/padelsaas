import { getCenterAction } from "@/lib/actions/center";
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

  const initialData = await getCenterAction();

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto py-6">
      <SettingsForm initialData={initialData} />
    </div>
  );
}
