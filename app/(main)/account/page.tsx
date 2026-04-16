import { getCurrentUserAction } from "@/lib/actions/user";
import { ProfileForm } from "@/components/profile-form";
import { PasswordForm } from "@/components/password-form";
import {
  LucideUserCircle2,
  LucideShieldCheck
} from "lucide-react";

export default async function AccountPage() {
  const initialData = await getCurrentUserAction();

  return (
    <div className="flex-1 space-y-10 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">Mi Cuenta</h2>
          <p className="text-muted-foreground text-lg">
            Gestiona tus datos personales y configuración de seguridad.
          </p>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2 items-stretch">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center gap-2 px-2 text-muted-foreground">
            <LucideUserCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Perfil</span>
          </div>
          <ProfileForm initialData={initialData} />
        </div>

        <div className="flex flex-col space-y-6">
          <div className="flex items-center gap-2 px-2 text-muted-foreground">
            <LucideShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Seguridad</span>
          </div>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
