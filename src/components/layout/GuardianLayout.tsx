import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { GuardianSidebar } from '@/components/GuardianSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface GuardianLayoutProps {
  children: React.ReactNode;
}

export function GuardianLayout({ children }: GuardianLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <GuardianSidebar />

        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center justify-between h-full px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h2 className="text-lg font-semibold text-foreground">Portal do Responsável</h2>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
