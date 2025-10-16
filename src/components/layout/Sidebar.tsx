import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, CheckSquare, CreditCard, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Alunos", path: "/students", icon: Users },
  { name: "Turmas", path: "/classes", icon: GraduationCap },
  { name: "Presenças", path: "/attendance", icon: CheckSquare },
  { name: "Pagamentos", path: "/payments", icon: CreditCard },
  { name: "Configurações", path: "/settings", icon: Settings },
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
      return;
    }
    navigate("/");
  };

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-primary to-primary/90 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <img 
          src="/src/assets/xpace-logo.png" 
          alt="Xpace Control" 
          className="h-12 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
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
          Sair
        </Button>
      </div>
    </aside>
  );
}
