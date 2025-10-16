import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Mail, Search } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="max-w-lg w-full animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-lg">
            Página não encontrada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate("/")} 
              className="gap-2"
              size="lg"
            >
              <Home className="h-4 w-4" />
              Voltar para Home
            </Button>
            
            <Button 
              onClick={() => window.location.href = "mailto:suporte@xpacecontrol.com.br"}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <Mail className="h-4 w-4" />
              Contatar Suporte
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Se você acredita que isso é um erro, entre em contato com nossa equipe de suporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
