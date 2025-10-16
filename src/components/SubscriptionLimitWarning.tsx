import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"] & {
  plans?: Database["public"]["Tables"]["plans"]["Row"];
};

interface SubscriptionLimitWarningProps {
  subscription: Subscription | null;
  currentCount: number;
}

export function SubscriptionLimitWarning({
  subscription,
  currentCount,
}: SubscriptionLimitWarningProps) {
  const navigate = useNavigate();

  if (!subscription?.plans?.student_limit) return null;

  const limit = subscription.plans.student_limit;
  const percentage = (currentCount / limit) * 100;

  // Show warning when at 80% or more
  if (percentage < 80) return null;

  const isAtLimit = currentCount >= limit;

  return (
    <Alert
      variant={isAtLimit ? "destructive" : "default"}
      className={isAtLimit ? "" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className={isAtLimit ? "" : "text-yellow-800 dark:text-yellow-200"}>
        {isAtLimit ? "Limite de alunos atingido!" : "Limite de alunos próximo!"}
      </AlertTitle>
      <AlertDescription
        className={isAtLimit ? "" : "text-yellow-700 dark:text-yellow-300"}
      >
        <div className="space-y-2">
          <p>
            Você está usando <strong>{currentCount}</strong> de{" "}
            <strong>{limit}</strong> alunos do seu plano{" "}
            <strong>{subscription.plans.name}</strong>.
          </p>
          {isAtLimit && (
            <p>
              Para adicionar mais alunos, você precisa fazer upgrade do seu plano.
            </p>
          )}
          <Button
            onClick={() => navigate("/planos")}
            variant={isAtLimit ? "default" : "outline"}
            className={isAtLimit ? "gradient-xpace" : ""}
            size="sm"
          >
            <Crown className="h-4 w-4 mr-2" />
            {isAtLimit ? "Fazer Upgrade" : "Ver Planos"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
