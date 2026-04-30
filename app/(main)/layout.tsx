import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
    </SidebarProvider>
  );
}
