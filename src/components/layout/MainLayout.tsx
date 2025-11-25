
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu, X } from "lucide-react";

export const MainLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Sidebar para Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <Sidebar />
      </div>

      {/* Conteúdo Principal (com padding à esquerda em telas grandes) */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header para Mobile com Botão de Menu */}
        <header className="flex md:hidden items-center justify-between px-4 py-2 bg-background border-b sticky top-0 z-30">
           <div className="flex items-center gap-2">
               <img src="/xpace-black.png" alt="XPACE OS" className="h-8 w-auto dark:hidden" />
               <img src="/xpace-white.png" alt="XPACE OS" className="h-8 w-auto hidden dark:block" />
           </div>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="left">
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-full w-64">
                <Sidebar />
            </DrawerContent>
          </Drawer>
        </header>

        {/* Conteúdo da Página */}
        <main className="flex-1 p-4 md:p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
