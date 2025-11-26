
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  LayoutGrid, User, Users, School, BookOpen, Banknote, BarChart, Settings, Calendar, LogOut, DollarSign, FileText, CreditCard, Palette, Shirt, Music, Clapperboard
} from "lucide-react";

const adminNavItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/alunos", icon: Users, label: "Alunos" },
  { href: "/turmas", icon: School, label: "Turmas" },
  {
    label: "Financeiro",
    icon: Banknote,
    subItems: [
      { href: "/financeiro/dashboard", icon: LayoutGrid, label: "Dashboard" },
      { href: "/financeiro/planos", icon: CreditCard, label: "Planos" },
      { href: "/financeiro/contas-receber", icon: DollarSign, label: "Contas a Receber" },
    ],
  },
  {
    label: "Artístico",
    icon: Palette,
    subItems: [
      { href: "/figurinos", icon: Shirt, label: "Figurinos" },
      { href: "/coreografias", icon: Music, label: "Coreografias" },
      { href: "/eventos", icon: Clapperboard, label: "Eventos" },
    ],
  },
  { href: "/presencas", icon: BookOpen, label: "Relatório de Presença" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

const teacherNavItems = [
  { href: "/professor/turmas", icon: School, label: "Minhas Turmas" },
  { href: "/professor/agenda", icon: Calendar, label: "Minha Agenda" },
];

const studentNavItems = [
    { href: "/aluno/dashboard", icon: LayoutGrid, label: "Meu Painel" },
    { href: "/aluno/turmas", icon: School, label: "Minhas Turmas" },
    { href: "/aluno/avaliacoes", icon: BookOpen, label: "Minhas Avaliações" },
    { href: "/aluno/financeiro", icon: DollarSign, label: "Meu Financeiro" },
    { href: "/aluno/agenda", icon: Calendar, label: "Agenda" },
];

const getNavItems = (role) => {
    switch (role) {
        case 'admin':
            return adminNavItems;
        case 'teacher':
            return teacherNavItems;
        case 'student':
            return studentNavItems;
        default:
            return [];
    }
};

export const Sidebar = ({ className }) => {
  const { user, logout } = useAuth(); 
  const location = useLocation();

  const navItems = getNavItems(user?.role);

  return (
    <div className={cn("h-full bg-background border-r flex flex-col", className)}>
      <div className="p-4 flex items-center justify-center border-b">
        <img src="/xpace-black.png" alt="XPACE OS" className="h-10 w-auto dark:hidden" />
        <img src="/xpace-white.png" alt="XPACE OS" className="h-10 w-auto hidden dark:block" />
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <Accordion type="multiple" className="w-full" defaultValue={['item-1', 'item-2', 'item-3']}>
          {navItems.map((item, index) => (
            item.subItems ? (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="py-2 px-3 hover:bg-muted rounded-md text-base font-normal">
                  <div className="flex items-center"><item.icon className="mr-2 h-4 w-4" />{item.label}</div>
                </AccordionTrigger>
                <AccordionContent className="pl-4 pt-1">
                  {item.subItems.map(subItem => (
                    <Button key={subItem.href} asChild variant={location.pathname === subItem.href ? "secondary" : "ghost"} className="w-full justify-start mt-1">
                      <Link to={subItem.href}><subItem.icon className="mr-2 h-4 w-4" />{subItem.label}</Link>
                    </Button>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ) : (
              <Button key={item.href} asChild variant={location.pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start text-base font-normal py-2 px-3">
                <Link to={item.href as string}><item.icon className="mr-2 h-4 w-4" />{item.label}</Link>
              </Button>
            )
          ))}
        </Accordion>
      </nav>
      <div className="p-2 border-t mt-auto"><Button onClick={logout} variant="ghost" className="w-full justify-start"><LogOut className="mr-2 h-4 w-4" />Sair</Button></div>
    </div>
  );
};
