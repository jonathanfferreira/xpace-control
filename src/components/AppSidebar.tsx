import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  BarChart3,
  UserPlus,
  Calendar,
  Settings,
  LogOut,
  Bell,
  Building2,
  Music,
  Shirt,
  Sparkles,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  Building,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
// Logo is now loaded from /public

const adminItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Alunos', url: '/alunos', icon: Users },
  { title: 'Turmas', url: '/turmas', icon: GraduationCap },
  { title: 'Presenças', url: '/presencas', icon: ClipboardCheck },
  { title: 'Pagamentos', url: '/pagamentos', icon: CreditCard },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Eventos', url: '/eventos', icon: Calendar },
  { title: 'Leads', url: '/leads', icon: UserPlus },
  { title: 'Notificações', url: '/notificacoes', icon: Bell },
  { title: 'Unidades', url: '/unidades', icon: Building2 },
  // Dança
  { title: 'Estilos de Dança', url: '/estilos-danca', icon: Music },
  { title: 'Coreografias', url: '/coreografias', icon: Sparkles },
  { title: 'Figurinos', url: '/figurinos', icon: Shirt },
  // Financeiro
  { title: 'Dashboard Financeiro', url: '/financeiro/dashboard', icon: BarChart3 },
  { title: 'Caixa', url: '/financeiro/caixa', icon: Wallet },
  { title: 'Contas a Pagar', url: '/financeiro/contas-pagar', icon: TrendingDown },
  { title: 'Contas a Receber', url: '/financeiro/contas-receber', icon: TrendingUp },
  { title: 'Contas Financeiras', url: '/financeiro/contas-financeiras', icon: Building },
  { title: 'Vendas', url: '/financeiro/vendas', icon: ShoppingCart },
  { title: 'Comissões', url: '/financeiro/comissoes', icon: Receipt },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

const teacherItems = [
  { title: 'Minhas Turmas', url: '/professor/turmas', icon: GraduationCap },
  { title: 'Presenças', url: '/professor/presencas', icon: ClipboardCheck },
  { title: 'Agenda', url: '/professor/agenda', icon: Calendar },
];

const guardianItems = [
  { title: 'Meus Alunos', url: '/responsavel/alunos', icon: Users },
  { title: 'Pagamentos', url: '/responsavel/pagamentos', icon: CreditCard },
  { title: 'Presenças', url: '/responsavel/presencas', icon: ClipboardCheck },
  { title: 'Eventos', url: '/responsavel/eventos', icon: Calendar },
];

const studentItems = [
  { title: 'Agenda', url: '/aluno/agenda', icon: Calendar },
  { title: 'Minhas Turmas', url: '/aluno/turmas', icon: GraduationCap },
  { title: 'Ler QR Code', url: '/aluno/qrcode', icon: ClipboardCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { role, signOut } = useAuth();
  const collapsed = state === 'collapsed';

  const getItems = () => {
    switch (role) {
      case 'admin':
        return adminItems;
      case 'teacher':
        return teacherItems;
      case 'parent':
        return guardianItems;
      case 'student':
        return studentItems;
      default:
        return [];
    }
  };

  const items = getItems();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-primary text-primary-foreground font-medium'
      : 'hover:bg-muted';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarContent>
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
          <img 
            src="/xpace-white.png" 
            alt="XPACE Control" 
            className={collapsed ? 'h-8' : 'h-10'} 
          />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sair</span>}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
