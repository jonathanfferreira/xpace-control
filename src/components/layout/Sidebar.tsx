import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, CheckSquare, CreditCard, Settings, LogOut, Menu, X, Bell, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useDemo } from "@/contexts/DemoContext";
import xpaceLogo from "@/assets/xpace-logo.png";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Alunos", path: "/students", icon: Users },
  { name: "Turmas", path: "/classes", icon: GraduationCap },
  { name: "Presenças", path: "/attendance", icon: CheckSquare },
  { name: "Pagamentos", path: "/payments", icon: CreditCard },
  { name: "Notificações", path: "/notifications", icon: Bell },
  { name: "Unidades", path: "/units", icon: Building2 },
  { name: "Configurações", path: "/settings", icon: Settings },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { isDemoMode, setDemoMode } = useDemo();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    if (isDemoMode) {
      setDemoMode(false);
      toast.success("Saindo do modo demo");
      navigate("/");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
      return;
    }
    navigate("/");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-primary text-white hover:bg-primary/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 min-h-screen bg-gradient-to-b from-primary to-primary/90 text-white flex flex-col
        fixed lg:sticky top-0 z-40 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <img 
            src={xpaceLogo}
            alt="Xpace Control" 
            className="h-12 w-auto"
          />
          {isDemoMode && (
            <div className="mt-2 px-2 py-1 bg-accent rounded text-xs font-semibold">
              MODO DEMO
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-white/20 shadow-lg"
                      : "hover:bg-white/10"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {isDemoMode ? "Sair do Demo" : "Sair"}
          </Button>
        </div>
      </aside>
    </>
  );
}
