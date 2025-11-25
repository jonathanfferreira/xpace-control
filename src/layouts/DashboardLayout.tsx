
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
// CORREÇÃO: A importação agora aponta para o arquivo .tsx
import { SIDENAV_ITEMS_ADMIN, SIDENAV_ITEMS_TEACHER, SIDENAV_ITEMS_GUARDIAN, SIDENAV_ITEMS_STUDENT } from '@/lib/sideNavItems.tsx';
import type { SideNavItem } from '@/lib/sideNavItems.tsx';
import { SchoolLogo } from '@/components/SchoolLogo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, Menu as MenuIcon, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSchoolTheme } from '@/contexts/SchoolThemeContext';

const DashboardLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Você saiu com segurança.");
      navigate('/auth');
    } catch (error) {
      toast.error("Erro ao tentar sair.");
      console.error("Logout failed", error);
    }
  };

  let menuItems: SideNavItem[] = [];
  if (user?.role === 'admin') menuItems = SIDENAV_ITEMS_ADMIN;
  if (user?.role === 'teacher') menuItems = SIDENAV_ITEMS_TEACHER;
  if (user?.role === 'guardian') menuItems = SIDENAV_ITEMS_GUARDIAN;
  if (user?.role === 'student') menuItems = SIDENAV_ITEMS_STUDENT;

  return (
    <div className="flex h-screen bg-muted/40">
      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="w-72 bg-background text-foreground flex-col hidden md:flex">
        <div className="h-16 flex items-center justify-center border-b">
           <SchoolLogo />
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex-1 px-4 py-6 space-y-4">
            {menuItems.map((item, idx) => (
              item.isHeader ? <MenuHeader key={idx} item={item} /> : <MenuItem key={idx} item={item} />
            ))}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t">
          <MenuItem item={{ path: '/configuracoes', title: 'Configurações', icon: <LogOut className="h-5 w-5" /> }} />
          <button onClick={handleLogout} className="flex items-center gap-3 text-muted-foreground hover:text-destructive w-full p-3 transition rounded-lg">
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* --- HEADER (Mobile) & CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-screen">
        <header className="bg-background border-b h-16 flex items-center justify-between px-4 md:hidden">
          <SchoolLogo />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon"><MenuIcon className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <div className="h-16 flex items-center justify-center border-b">
                    <SchoolLogo />
                </div>
                <ScrollArea className="flex-1">
                    <nav className="flex-1 px-4 py-6 space-y-4">
                        {menuItems.map((item, idx) => (
                        item.isHeader ? <MenuHeader key={idx} item={item} /> : <MenuItem key={idx} item={item} />
                        ))}
                    </nav>
                </ScrollArea>
                <div className="p-4 border-t">
                     <MenuItem item={{ path: '/configuracoes', title: 'Configurações', icon: <LogOut className="h-5 w-5" /> }} />
                    <button onClick={handleLogout} className="flex items-center gap-3 text-muted-foreground hover:text-destructive w-full p-3 transition rounded-lg">
                        <LogOut className="h-5 w-5" />
                        <span>Sair</span>
                    </button>
                </div>
            </SheetContent>
          </Sheet>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const MenuItem = ({ item }: { item: SideNavItem }) => {
    const { color } = useSchoolTheme();
    const activeStyle = {
        backgroundColor: color,
        color: 'white',
    };

  return (
    <NavLink 
      to={item.path || ''} 
      end
      style={({ isActive }) => isActive ? activeStyle : {}}
      className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {item.icon}
      <span className="font-medium">{item.title}</span>
    </NavLink>
  );
}

const MenuHeader = ({ item }: { item: SideNavItem }) => (
    <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
        {item.title}
    </div>
);

export default DashboardLayout;
