
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiLogIn, FiUserPlus, FiLoader } from "react-icons/fi";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const toggleMode = () => {
    setMode(prevMode => (prevMode === "login" ? "signup" : "login"));
    // Limpa os campos ao trocar de modo
    setName("");
    setEmail("");
    setPassword("");
  };

  const isLoginMode = mode === "login";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
        toast.success("Login bem-sucedido!");
      } else {
        await signup(email, password, name);
        toast.success("Conta criada com sucesso!");
      }
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Falha na autenticação:", error);
      toast.error(error.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {isLoginMode ? "Acessar Plataforma" : "Criar Conta"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Bem-vindo ao <span className="font-bold text-green-500">XPACE OS</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLoginMode && (
             <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
            {isLoading ? (
              <FiLoader className="animate-spin" />
            ) : isLoginMode ? (
              <FiLogIn />
            ) : (
              <FiUserPlus />
            )}
            <span>{isLoading ? "Processando..." : isLoginMode ? "Entrar" : "Cadastrar"}</span>
          </Button>
        </form>

        <p className="text-sm text-center text-gray-600">
          {isLoginMode ? "Não tem uma conta?" : "Já possui uma conta?"}
          <button
            onClick={toggleMode}
            className="ml-1 font-medium text-green-600 hover:underline"
            disabled={isLoading}
          >
            {isLoginMode ? "Cadastre-se" : "Faça login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
