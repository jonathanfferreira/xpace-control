import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, QrCode, CreditCard, BarChart3, Shield, Star } from "lucide-react";
import xpaceLogo from "@/assets/xpace-logo.png";
import heroDance from "@/assets/hero-dance.jpg";
import { useDemo } from "@/contexts/DemoContext";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { setDemoMode } = useDemo();

  const handleDemoClick = () => {
    setDemoMode(true);
    toast.success("Entrando no modo demonstração...");
    setTimeout(() => navigate("/dashboard"), 500);
  };

  const features = [
    {
      icon: Users,
      title: "Gestão de Alunos",
      description: "Cadastre e gerencie alunos, responsáveis e informações de contato de forma centralizada.",
    },
    {
      icon: Calendar,
      title: "Controle de Turmas",
      description: "Crie turmas, defina horários e organize sua grade de aulas com facilidade.",
    },
    {
      icon: QrCode,
      title: "Presença via QR Code",
      description: "Marque presenças de forma rápida e moderna com QR codes únicos por turma.",
    },
    {
      icon: CreditCard,
      title: "Gestão de Pagamentos",
      description: "Acompanhe mensalidades, gere boletos e controle pagamentos em um só lugar.",
    },
    {
      icon: BarChart3,
      title: "Relatórios e Métricas",
      description: "Visualize estatísticas de presença, financeiro e desempenho da escola.",
    },
    {
      icon: Shield,
      title: "Segurança e Privacidade",
      description: "Dados criptografados e políticas de acesso rigorosas para proteger suas informações.",
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
          <nav className="flex items-center gap-2 md:gap-4">
            <Link to="/auth" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="md:h-10">Entrar</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="sm" className="md:h-10">
                <span className="hidden sm:inline">Começar Agora</span>
                <span className="sm:hidden">Começar</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20 lg:py-32">
        <div className="container px-4">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col gap-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-primary bg-primary/10 px-3 md:px-4 py-2 rounded-full w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Plataforma Completa de Gestão
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight">
                O controle da sua escola de dança,{" "}
                <span className="gradient-xpace text-gradient">simples, bonito e inteligente</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                Controle presenças, turmas, alunos e pagamentos em uma plataforma moderna, 
                simples e eficiente. Foque no que realmente importa: ensinar dança.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                  <Button size="lg" variant="hero" className="group w-full sm:w-auto">
                    Testar Agora
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" onClick={handleDemoClick} className="w-full sm:w-auto">
                  Ver Demo
                </Button>
              </div>
            </div>
            <div className="relative animate-float order-first lg:order-last">
              <div className="absolute inset-0 gradient-xpace opacity-20 blur-3xl rounded-full"></div>
              <img 
                src={heroDance} 
                alt="Escola de dança moderna" 
                className="relative rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Recursos pensados para facilitar o dia a dia de escolas de dança e academias
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-xl bg-card border hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-12 md:py-20">
        <div className="container px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4">
              O que dizem nossos clientes
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolas de dança que já transformaram sua gestão com o Xpace Control
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl bg-card border">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-lg mb-4 italic">
                "O Xpace Control revolucionou nossa gestão! A presença por QR code economiza muito tempo e os relatórios são incríveis."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  MC
                </div>
                <div>
                  <p className="font-semibold">Maria Clara</p>
                  <p className="text-sm text-muted-foreground">Escola de Ballet Arte & Movimento</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-card border">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-lg mb-4 italic">
                "Antes gastávamos horas com controle de pagamentos. Agora tudo é automático e organizado. Recomendo demais!"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  RS
                </div>
                <div>
                  <p className="font-semibold">Roberto Santos</p>
                  <p className="text-sm text-muted-foreground">Studio de Dança Urbana</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container px-4">
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl gradient-xpace p-8 md:p-12 lg:p-20 text-center">
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-4">
                Criar Conta Grátis
              </h2>
              <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
                Comece hoje mesmo e transforme a gestão da sua escola de dança
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="secondary" className="group w-full sm:w-auto">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-2 text-center md:text-left">
              <img src={xpaceLogo} alt="Xpace Control" className="h-6 md:h-8 w-auto" />
              <span className="text-xs md:text-sm text-muted-foreground">
                © 2025 Xpace Control. Todos os direitos reservados.
              </span>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start text-center">
              <a href="#funcionalidades" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#depoimentos" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Depoimentos
              </a>
              <Link to="/auth" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <a href="mailto:contato@xpacecontrol.com" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
