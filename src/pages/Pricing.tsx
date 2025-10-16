import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Crown, Zap } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Plan = Database["public"]["Tables"]["plans"]["Row"];
type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"] & {
  plans?: Plan;
};
type School = Database["public"]["Tables"]["schools"]["Row"];

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch school
      const { data: schoolData } = await supabase
        .from("schools")
        .select("*")
        .eq("admin_id", user.id)
        .single();

      if (schoolData) {
        setSchool(schoolData);

        // Fetch current subscription
        const { data: subData } = await supabase
          .from("subscriptions")
          .select(`
            *,
            plans(*)
          `)
          .eq("school_id", schoolData.id)
          .single();

        setSubscription(subData);
      }

      // Fetch available plans
      const { data: plansData } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("monthly_price");

      setPlans(plansData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!school) {
      toast.error("Você precisa criar uma escola primeiro");
      navigate("/configuracoes");
      return;
    }

    // Check if it's Enterprise plan
    const plan = plans.find(p => p.id === planId);
    if (plan?.name === "Enterprise") {
      toast.info("Por favor, entre em contato com nossa equipe para contratar o plano Enterprise");
      return;
    }

    try {
      // Mock payment flow for now
      toast.success("Processando pagamento...", { duration: 2000 });
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (subscription) {
        // Update existing subscription
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan_id: planId,
            status: "active",
            renew_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          })
          .eq("id", subscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            school_id: school.id,
            plan_id: planId,
            status: "active",
            renew_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          });

        if (error) throw error;
      }

      toast.success("Plano atualizado com sucesso! 🎉");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao atualizar plano: " + error.message);
    }
  };

  const getDaysRemaining = () => {
    if (!subscription?.renew_at) return 0;
    const now = new Date();
    const renewDate = new Date(subscription.renew_at);
    const diff = renewDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const renderFeatures = (features: any) => {
    try {
      const featureList = typeof features === "string" ? JSON.parse(features) : features;
      return Array.isArray(featureList) ? featureList : [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Planos e Assinaturas</h1>
          <p className="text-muted-foreground">Escolha o melhor plano para sua escola</p>
        </div>

        {/* Current Subscription Info */}
        {subscription && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Plano Atual: {subscription.plans?.name}
              </CardTitle>
              <CardDescription>
                {subscription.status === "trial" ? (
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    Trial - {getDaysRemaining()} dias restantes
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Ativo - Renova em {new Date(subscription.renew_at || "").toLocaleDateString("pt-BR")}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan_id === plan.id;
            const features = renderFeatures(plan.features);

            return (
              <Card
                key={plan.id}
                className={isCurrentPlan ? "border-primary shadow-lg" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    {plan.name === "Pro" && (
                      <Badge className="bg-gradient-to-r from-primary to-accent">
                        <Zap className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      R$ {plan.monthly_price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <CardDescription>
                    {plan.student_limit
                      ? `Até ${plan.student_limit} alunos`
                      : "Alunos ilimitados"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full gradient-xpace"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan && subscription?.status === "active"}
                  >
                    {isCurrentPlan && subscription?.status === "active"
                      ? "Plano Atual"
                      : isCurrentPlan && subscription?.status === "trial"
                      ? "Ativar Plano"
                      : "Escolher Plano"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Trial Warning */}
        {subscription?.status === "trial" && getDaysRemaining() <= 5 && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">
                ⚠️ Seu período de trial está terminando
              </CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Você tem {getDaysRemaining()} dias restantes no período trial. Escolha um plano para
                continuar usando o Xpace Control sem interrupções.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
