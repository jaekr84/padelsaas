import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-2">
              Panel de Administración
            </h2>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          {children}
        </div>
        <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
          Designed & Developed by{" "}
          <a 
            href="https://x.com/Kr84Jae" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            @JaeKr84
          </a>
        </footer>
      </SidebarInset>
      <Toaster />
    </Providers>
  );
}
