import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student' | 'guardian';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      setRole(data?.role as UserRole || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      toast({
        title: 'Erro ao carregar perfil',
        description: 'Não foi possível carregar suas permissões.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Login realizado',
        description: 'Bem-vindo de volta!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao entrar',
        description: error.message || 'Credenciais inválidas',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Conta criada',
        description: 'Sua conta foi criada com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Não foi possível criar sua conta',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
      
      navigate('/entrar');
    } catch (error: any) {
      toast({
        title: 'Erro ao sair',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/recuperar`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao recuperar senha',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getRedirectPath = (userRole: UserRole): string => {
    switch (userRole) {
      case 'admin':
        return '/dashboard';
      case 'teacher':
        return '/professor/turmas';
      case 'parent':
        return '/responsavel/alunos';
      case 'guardian':
        return '/guardian/students';
      case 'student':
        return '/aluno/agenda';
      default:
        return '/';
    }
  };

  return {
    user,
    session,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    getRedirectPath,
  };
}
