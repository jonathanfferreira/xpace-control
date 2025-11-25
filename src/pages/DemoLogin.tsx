import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/integrations/firebase/client";
import { useDemo } from "@/contexts/DemoContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
// Assuming a firebase function `seedDemo` exists.

export default function DemoLogin() {
  const navigate = useNavigate();
  const { setDemoMode } = useDemo();
  const [status, setStatus] = useState("Inicializando demo...");

  useEffect(() => {
    const initDemo = async () => {
      try {
        // Check if correct user is already logged in
        if (auth.currentUser?.email === 'demo@xpacecontrol.com') {
          setDemoMode(true);
          navigate('/dashboard');
          return;
        }

        // Sign out any existing user
        await signOut(auth);

        setStatus("Preparando dados demo...");
        
        // TODO: Replace with actual call to a Firebase Function to seed data
        // For now, we'll just simulate a delay.
        await new Promise(res => setTimeout(res, 2000));
        // const seedDemo = httpsCallable(functions, 'seedDemo');
        // await seedDemo();

        setStatus("Fazendo login...");

        // Sign in with demo credentials
        await signInWithEmailAndPassword(auth, 'demo@xpacecontrol.com', 'demo123456');

        setDemoMode(true);
        toast.success("Bem-vindo ao modo DEMO!");
        navigate('/dashboard');

      } catch (error) {
        console.error('Demo login error:', error);
        toast.error("Erro ao iniciar modo demo. Verifique as credenciais e a função de seed.");
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
