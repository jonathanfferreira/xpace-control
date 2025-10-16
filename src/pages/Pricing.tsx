import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import xpaceLogo from "@/assets/xpace-logo.png";

const Pricing = () => {
  const handleSubscribe = (planName: string) => {
    toast.success(`Plano ${planName} ativado com sucesso!`, {
      description: "Você já pode começar a usar todos os recursos.",
    });
  };

  const plans = [
    {
      name: "Start",
      price: "R$ 49",
      period: "/mês",
      description: "Perfeito para começar",
      features: [
        "Até 50 alunos",
        "Turmas ilimitadas",
        "Controle de presenças via QR Code",
        "Gestão de pagamentos",
        "Relatórios básicos",
        "Suporte por email",
      ],
      cta: "Começar Agora",
      popular: false,
    },
    {
      name: "Pro",
      price: "R$ 99",
      period: "/mês",
      description: "Para escolas em crescimento",
      features: [
        "Alunos ilimitados",
        "Turmas ilimitadas",
        "Controle de presenças via QR Code",
        "Gestão de pagamentos avançada",
        "Relatórios completos e analytics",
        "Multi-unidades",
        "Suporte prioritário",
        "API de integração",
      ],
      cta: "Assinar Pro",
      popular: true,
    },
    {
      name: "Personalizado",
      price: "Sob consulta",
      period: "",
      description: "Solução customizada",
      features: [
        "Tudo do plano Pro",
        "Customização completa",
        "Treinamento da equipe",
        "Gerente de conta dedicado",
        "Migração de dados",
        "SLA garantido",
      ],
      cta: "Falar com Vendas",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={xpaceLogo} alt="Xpace Control" className="h-8 md:h-10 w-auto" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-12 md:py-20">
        <div className="container px-4">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Escolha o plano ideal para sua escola
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Planos flexíveis que crescem com seu negócio. Sem taxas escondidas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative flex flex-col ${
                  plan.popular
                    ? "border-primary shadow-2xl scale-105 md:scale-110"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="gradient-xpace text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Mais Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl md:text-5xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.popular ? "hero" : "outline"}
                    size="lg"
                    onClick={() => handleSubscribe(plan.name)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-16 md:mt-24 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Perguntas Frequentes</h2>
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h3>
                <p className="text-sm text-muted-foreground">
                  Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas adicionais.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2">Existe período de teste?</h3>
                <p className="text-sm text-muted-foreground">
                  Sim! Oferecemos 14 dias de teste grátis em todos os planos para você conhecer a plataforma.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2">Como funciona o suporte?</h3>
                <p className="text-sm text-muted-foreground">
                  Plano Start tem suporte por email. Plano Pro tem suporte prioritário por email e WhatsApp.
                  Plano Personalizado inclui gerente de conta dedicado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
