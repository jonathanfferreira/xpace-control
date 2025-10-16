import { Users, Calendar, CreditCard } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const guardianItems = [
  { title: 'Meus Alunos', url: '/guardian/students', icon: Users },
  { title: 'Frequência', url: '/guardian/attendance', icon: Calendar },
  { title: 'Pagamentos', url: '/guardian/payments', icon: CreditCard },
];

export function GuardianSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-4 py-6">
          <div className="flex items-center gap-2">
            <img
              src="/xpace-black.png"
              alt="XPACE Control"
              className="h-8 w-auto object-contain dark:hidden transition-opacity duration-300"
            />
            <img
              src="/xpace-white.png"
              alt="XPACE Control"
              className="h-8 w-auto object-contain hidden dark:block transition-opacity duration-300"
            />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Portal do Responsável</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {guardianItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      <span className="ml-2">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
