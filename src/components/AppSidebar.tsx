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
  ChevronRight,
  ShoppingBag, // <-- Importado
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// Tipos de itens do menu
interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

type MenuItemOrGroup = MenuItem | MenuGroup;

// Função type guard para verificar se é um grupo
function isMenuGroup(item: MenuItemOrGroup): item is MenuGroup {
  return 'items' in item;
}

const adminItems: MenuItemOrGroup[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Alunos', url: '/alunos', icon: Users },
  { title: 'Turmas', url: '/turmas', icon: GraduationCap },
  { title: 'Presenças', url: '/presencas', icon: ClipboardCheck },
  { title: 'Pagamentos', url: '/pagamentos', icon: CreditCard },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Leads', url: '/leads', icon: UserPlus },
  { title: 'Notificações', url: '/notificacoes', icon: Bell },
  { title: 'Unidades', url: '/unidades', icon: Building2 },
  // Grupo Artístico
  {
    title: 'Artístico',
    icon: Music,
    items: [
      { title: 'Coreografias', url: '/coreografias', icon: Sparkles },
      { title: 'Figurinos', url: '/figurinos', icon: Shirt },
      { title: 'Eventos', url: '/eventos', icon: Calendar },
      { title: 'Produtos', url: '/produtos', icon: ShoppingBag }, // <-- Adicionado
    ],
  },
  // Grupo Financeiro
  {
    title: 'Financeiro',
    icon: DollarSign,
    items: [
      { title: 'Dashboard', url: '/financeiro/dashboard', icon: BarChart3 },
      { title: 'Caixa', url: '/financeiro/caixa', icon: Wallet },
      { title: 'Contas a Pagar', url: '/financeiro/contas-pagar', icon: TrendingDown },
      { title: 'Contas a Receber', url: '/financeiro/contas-receber', icon: TrendingUp },
      { title: 'Contas Financeiras', url: '/financeiro/contas-financeiras', icon: Building },
      { title: 'Vendas', url: '/financeiro/vendas', icon: ShoppingCart },
      { title: 'Comissões', url: '/financeiro/comissoes', icon: Receipt },
    ],
  },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

const teacherItems: MenuItem[] = [
  { title: 'Minhas Turmas', url: '/professor/turmas', icon: GraduationCap },
  { title: 'Presenças', url: '/professor/presencas', icon: ClipboardCheck },
  { title: 'Agenda', url: '/professor/agenda', icon: Calendar },
];

const guardianItems: MenuItem[] = [
  { title: 'Meus Alunos', url: '/responsavel/alunos', icon: Users },
  { title: 'Pagamentos', url: '/responsavel/pagamentos', icon: CreditCard },
  { title: 'Presenças', url: '/responsavel/presencas', icon: ClipboardCheck },
  { title: 'Eventos', url: '/responsavel/eventos', icon: Calendar },
];

const studentItems: MenuItem[] = [
  { title: 'Agenda', url: '/aluno/agenda', icon: Calendar },
  { title: 'Minhas Turmas', url: '/aluno/turmas', icon: GraduationCap },
  { title: 'Ler QR Code', url: '/aluno/qrcode', icon: ClipboardCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { role, signOut } = useAuth();
  const collapsed = state === 'collapsed';
  
  // Estados para controlar quais grupos estão abertos
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Artístico': false,
    'Financeiro': false,
  });

  const getItems = (): MenuItemOrGroup[] => {
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

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';

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
              {items.map((item) => {
                // Se for um grupo com submenus
                if (isMenuGroup(item)) {
                  return (
                    <Collapsible
                      key={item.title}
                      open={openGroups[item.title]}
                      onOpenChange={() => toggleGroup(item.title)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                            {!collapsed && (
                              <ChevronRight
                                className={`ml-auto h-4 w-4 transition-transform ${
                                  openGroups[item.title] ? 'rotate-90' : ''
                                }`}
                              />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink to={subItem.url} className={getNavCls}>
                                    <subItem.icon className="h-4 w-4" />
                                    <span>{subItem.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Se for um item simples
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
