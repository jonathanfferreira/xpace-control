
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/services/authService";
import { FcGoogle } from "react-icons/fc";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Login com Google realizado com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Falha no login com Google. Tente novamente.");
      console.error(error);
    }
  };

  if (loading || user) {
    // Show a loading state or nothing while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Carregando...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-xpace">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <div className="flex items-center gap-2">
               <img src="/xpace-black.png" alt="XPACE OS" className="h-12 w-auto dark:hidden" />
               <img src="/xpace-white.png" alt="XPACE OS" className="h-12 w-auto hidden dark:block" />
             </div>
           </div>
          <CardTitle className="text-2xl">Bem-vindo ao XPACE OS</CardTitle>
          <CardDescription>O sistema de gestão para escolas de dança.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground">Comece fazendo login com sua conta Google.</p>
            <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
              <FcGoogle className="mr-2 h-5 w-5" />
              Entrar com Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
