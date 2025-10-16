import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
// Logo is now loaded from /public

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error) {
      // Error handled by useAuth
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <img src="/xpace-black.png" alt="XPACE Control" className="h-12 dark:hidden" />
              <img src="/xpace-white.png" alt="XPACE Control" className="h-12 hidden dark:block" />
            </div>
            <div>
              <CardTitle className="text-2xl">Email Enviado</CardTitle>
              <CardDescription>
                Verifique sua caixa de entrada
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Enviamos um link para redefinir sua senha para <strong>{email}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Não se esqueça de verificar a pasta de spam.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/entrar">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <img src="/xpace-black.png" alt="XPACE Control" className="h-12 dark:hidden" />
            <img src="/xpace-white.png" alt="XPACE Control" className="h-12 hidden dark:block" />
          </div>
          <div>
            <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
            <CardDescription>
              Digite seu email para receber um link de recuperação
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Link de Recuperação
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/entrar">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Login
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
