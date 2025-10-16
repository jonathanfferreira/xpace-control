import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"] & {
  plans?: Database["public"]["Tables"]["plans"]["Row"];
};

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  currentCount: number;
  featureName?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  subscription,
  currentCount,
  featureName = "adicionar mais alunos",
}: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/planos");
  };

  const limit = subscription?.plans?.student_limit || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Limite do Plano Atingido
          </DialogTitle>
          <DialogDescription className="text-center space-y-3">
            <p>
              Você atingiu o limite de <strong>{limit} alunos</strong> do seu plano{" "}
              <strong>{subscription?.plans?.name}</strong>.
            </p>
            <p>
              Atualmente você tem <strong>{currentCount} alunos</strong> cadastrados.
            </p>
            <p>
              Para {featureName}, faça upgrade para um plano superior.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleUpgrade}
            className="w-full gradient-xpace"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            Ver Planos e Fazer Upgrade
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Voltar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
