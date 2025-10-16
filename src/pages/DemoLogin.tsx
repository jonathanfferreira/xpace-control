import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DemoLogin() {
  const navigate = useNavigate();
  const { setDemoMode } = useDemo();
  const [status, setStatus] = useState("Inicializando demo...");

  useEffect(() => {
    const initDemo = async () => {
      try {
        // Check if already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === 'demo@xpacecontrol.com') {
          setDemoMode(true);
          navigate('/dashboard');
          return;
        }

        // Sign out any existing session
        await supabase.auth.signOut();

        setStatus("Preparando dados demo...");
        
        // Call seed function
        const { data, error } = await supabase.functions.invoke('seed-demo');
        
        if (error) throw error;

        setStatus("Fazendo login...");

        // Sign in with demo credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: 'demo@xpacecontrol.com',
          password: 'demo123456'
        });

        if (signInError) throw signInError;

        setDemoMode(true);
        toast.success("Bem-vindo ao modo DEMO!");
        navigate('/dashboard');

      } catch (error) {
        console.error('Demo login error:', error);
        toast.error("Erro ao iniciar modo demo");
        navigate('/');
      }
    };

    initDemo();
  }, [navigate, setDemoMode]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">{status}</h2>
        <p className="text-muted-foreground">Aguarde enquanto preparamos a demonstração...</p>
      </div>
    </div>
  );
}
