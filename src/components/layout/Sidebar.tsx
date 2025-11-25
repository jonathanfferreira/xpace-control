
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutGrid, User, Users, School, BookOpen, Banknote, Bell, BarChart, Settings, Calendar, LogOut
} from "lucide-react";

const adminNavItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/alunos", icon: Users, label: "Alunos" },
  { href: "/turmas", icon: School, label: "Turmas" },
  { href: "/financeiro/dashboard", icon: Banknote, label: "Financeiro" },
  { href: "/relatorios", icon: BarChart, label: "Relatórios" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

const teacherNavItems = [
  { href: "/professor/turmas", icon: School, label: "Minhas Turmas" },
  { href: "/professor/agenda", icon: Calendar, label: "Minha Agenda" },
  { href: "/professor/presencas", icon: BookOpen, label: "Chamada" },
];

// Adicione mais perfis conforme necessário (student, guardian)

export const Sidebar = ({ className }) => {
  const { userProfile, isAdmin } = useAuth();
  const location = useLocation();

  // Determina quais links de navegação exibir
  const navItems = isAdmin ? adminNavItems : teacherNavItems;

  return (
    <div className={cn("h-full bg-background border-r flex flex-col", className)}>
      <div className="p-4 flex items-center justify-center border-b">
        <img src="/xpace-black.png" alt="XPACE OS" className="h-10 w-auto dark:hidden" />
        <img src="/xpace-white.png" alt="XPACE OS" className="h-10 w-auto hidden dark:block" />
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={location.pathname.startsWith(item.href) ? "default" : "ghost"}
            className="w-full justify-start"
          >
            <Link to={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="p-2 border-t">
        <Button variant="ghost" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
        </Button>
      </div>
    </div>
  );
};
