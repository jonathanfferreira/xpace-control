import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function DemoReset() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase.functions.invoke('seed-demo');
      
      if (error) throw error;

      setSuccess(true);
      toast.success("Dados demo resetados com sucesso!");

    } catch (error) {
      console.error('Reset error:', error);
      toast.error("Erro ao resetar dados demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle>Reset Demo Data</CardTitle>
          </div>
          <CardDescription>
            Esta ação irá resetar todos os dados de demonstração, incluindo alunos, turmas, presenças e pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Dados resetados com sucesso!</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              disabled={loading}
              className="flex-1"
              variant="destructive"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resetar Dados
                </>
              )}
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
            >
              Voltar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Nota: Esta funcionalidade deve ser usada apenas em ambiente de desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
