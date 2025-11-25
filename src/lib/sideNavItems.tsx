
import { Home, Users, BookOpen, CreditCard, Settings } from 'lucide-react';

// Define o tipo para um item da barra de navegação
export type SideNavItem = {
  title: string;
  path: string;
  icon?: JSX.Element;
  submenu?: SideNavItem[];
};

// Itens de menu para o perfil de Administrador
export const SIDENAV_ITEMS_ADMIN: SideNavItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
  { title: 'Alunos', path: '/dashboard/students', icon: <Users size={20} /> },
  { title: 'Turmas', path: '/dashboard/classes', icon: <BookOpen size={20} /> },
  { title: 'Financeiro', path: '/dashboard/financial', icon: <CreditCard size={20} /> },
  { title: 'Equipe', path: '/dashboard/staff', icon: <Users size={20} /> },
  { title: 'Configurações', path: '/dashboard/settings', icon: <Settings size={20} /> },
];

// Itens de menu para o perfil de Professor
export const SIDENAV_ITEMS_TEACHER: SideNavItem[] = [
    { title: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { title: 'Minhas Turmas', path: '/dashboard/classes', icon: <BookOpen size={20} /> },
];

// Itens de menu para o perfil de Responsável
export const SIDENAV_ITEMS_GUARDIAN: SideNavItem[] = [
    { title: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { title: 'Meus Dependentes', path: '/dashboard/dependents', icon: <Users size={20} /> },
    { title: 'Financeiro', path: '/dashboard/financial', icon: <CreditCard size={20} /> },
];

// Itens de menu para o perfil de Aluno
export const SIDENAV_ITEMS_STUDENT: SideNavItem[] = [
    { title: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { title: 'Minhas Notas', path: '/dashboard/grades', icon: <BookOpen size={20} /> },
    { title: 'Financeiro', path: '/dashboard/financial', icon: <CreditCard size={20} /> },
];
