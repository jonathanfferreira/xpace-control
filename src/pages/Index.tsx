import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, QrCode, CreditCard, BarChart3, Shield, Star, CheckCircle2, Sparkles, TrendingUp, Clock, Mail } from "lucide-react";
import heroDance from "@/assets/hero-dance.jpg";
import { useDemo } from "@/contexts/DemoContext";
import { toast } from "sonner";
import { LeadForm } from "@/components/LeadForm";
import { SEOHead } from "@/components/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { setDemoMode } = useDemo();

  const handleDemoClick = () => {
    navigate("/demo-login");
  };

  // Dynamic OG image switching based on theme
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches;

    const setMeta = (nameOrProp: 'name' | 'property', attr: string, val: string) => {
      const el = document.querySelector(`meta[${nameOrProp}="${attr}"]`);
      if (el) el.setAttribute("content", val);
    };

    if (isDark) {
      setMeta("property", "og:image", "/og-dark.png");
      setMeta("name", "twitter:image", "/og-dark.png");
    } else {
      setMeta("property", "og:image", "/og-light.png");
      setMeta("name", "twitter:image", "/og-light.png");
    }
  }, []);

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
    <>
      <SEOHead 
        title="Xpace Control - Sistema de Gestão Completo para Escolas de Dança"
        description="Transforme a gestão da sua escola de dança com o Xpace Control. Controle de presenças via QR Code, gestão de pagamentos, turmas e alunos em uma plataforma moderna e intuitiva."
        keywords="gestão escolas dança, controle presença QR Code, sistema pagamentos escola, gestão alunos turmas, software escola dança"
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur border-b border-border">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/xpace-black.png"
              alt="XPACE Control"
              className="h-6 md:h-8 w-auto object-contain dark:hidden transition-opacity duration-300"
            />
            <img
              src="/xpace-white.png"
              alt="XPACE Control"
              className="h-6 md:h-8 w-auto object-contain hidden dark:block transition-opacity duration-300"
            />
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            <Link to="/pricing" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="md:h-10">Preços</Button>
            </Link>
            <Link to="/auth" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="md:h-10">Entrar</Button>
            </Link>
            <ThemeToggle />
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
                  <Button size="lg" className="group w-full sm:w-auto bg-[#6324b2] text-white hover:opacity-90 transition-opacity">
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

      {/* Product Screenshots Section */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              Veja o produto
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4">
              Interface moderna e intuitiva
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa, em telas simples e bonitas
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center p-4">
                <img 
                  src="/placeholder.svg" 
                  alt="Dashboard com métricas e gráficos de desempenho"
                  className="w-full h-full object-cover rounded-lg"
                  sizes="100vw"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">Dashboard Completo</h3>
                <p className="text-sm text-muted-foreground">Visualize todas as métricas importantes em tempo real</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center p-4">
                <img 
                  src="/placeholder.svg" 
                  alt="Controle de presenças com QR Code"
                  className="w-full h-full object-cover rounded-lg"
                  sizes="100vw"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">Presença via QR Code</h3>
                <p className="text-sm text-muted-foreground">Marque presenças em segundos com tecnologia QR</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-orange-500/10 to-pink-500/10 flex items-center justify-center p-4">
                <img 
                  src="/placeholder.svg" 
                  alt="Gestão de turmas e horários"
                  className="w-full h-full object-cover rounded-lg"
                  sizes="100vw"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">Gestão de Turmas</h3>
                <p className="text-sm text-muted-foreground">Organize turmas, horários e alunos facilmente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Dance Schools Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              Para Escolas de Dança
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4">
              Benefícios concretos para sua escola
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Economize tempo, reduza custos e foque no que realmente importa
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="group p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Economize 10h por semana</h3>
              <p className="text-muted-foreground">
                Automatize controle de presença, pagamentos e relatórios. Pare de perder tempo com planilhas e cadernos.
              </p>
            </div>
            <div className="group p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reduza inadimplência em 40%</h3>
              <p className="text-muted-foreground">
                Lembretes automáticos, geração de boletos e controle financeiro completo em tempo real.
              </p>
            </div>
            <div className="group p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tenha insights inteligentes</h3>
              <p className="text-muted-foreground">
                IA identifica risco de evasão e sugere ações. Relatórios de presença, faturamento e desempenho.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-20">
        <div className="container px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece a usar em 3 passos simples
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative text-center">
              <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Criar escola</h3>
              <p className="text-muted-foreground">
                Cadastre sua escola em minutos. Adicione unidades, configure seus dados e personalize.
              </p>
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
            </div>
            <div className="relative text-center">
              <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Montar turmas</h3>
              <p className="text-muted-foreground">
                Crie turmas, defina horários, adicione alunos e professores. Tudo organizado e visual.
              </p>
              <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
            </div>
            <div className="relative text-center">
              <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Marcar presenças e cobrar</h3>
              <p className="text-muted-foreground">
                Use QR Code para presença instantânea. Gere cobranças automáticas e acompanhe tudo em tempo real.
              </p>
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
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            <div className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-base mb-4 italic">
                "O Xpace Control revolucionou nossa gestão! A presença por QR code economiza muito tempo e os relatórios são incríveis."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  MC
                </div>
                <div>
                  <p className="font-semibold">Maria Clara Souza</p>
                  <p className="text-sm text-muted-foreground">Escola de Ballet Arte & Movimento</p>
                  <p className="text-xs text-muted-foreground">São Paulo, SP</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-base mb-4 italic">
                "Antes gastávamos horas com controle de pagamentos. Agora tudo é automático e organizado. Recomendo demais!"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  RS
                </div>
                <div>
                  <p className="font-semibold">Roberto Santos</p>
                  <p className="text-sm text-muted-foreground">Studio de Dança Urbana</p>
                  <p className="text-xs text-muted-foreground">Rio de Janeiro, RJ</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-base mb-4 italic">
                "A IA que detecta risco de evasão é fantástica! Conseguimos agir antes de perder alunos. Imprescindível!"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                  AF
                </div>
                <div>
                  <p className="font-semibold">Ana Flávia Lima</p>
                  <p className="text-sm text-muted-foreground">Academia Ritmo & Movimento</p>
                  <p className="text-xs text-muted-foreground">Belo Horizonte, MG</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              15 dias grátis para testar. Cancele quando quiser.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Start Plan */}
            <div className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
              <h3 className="text-2xl font-bold mb-2">Start</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">R$ 99</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Ideal para escolas pequenas</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Até 50 alunos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">1 unidade</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Presença via QR Code</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Gestão de pagamentos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Relatórios básicos</span>
                </li>
              </ul>
              <Link to="/auth?mode=signup" className="block">
                <Button className="w-full" variant="outline">Começar grátis</Button>
              </Link>
            </div>

            {/* Pro Plan - Featured */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Mais Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">R$ 249</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Para escolas em crescimento</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Até 200 alunos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Até 3 unidades</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Todos os recursos do Start</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Relatórios avançados</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">IA de detecção de evasão</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Notificações automáticas</span>
                </li>
              </ul>
              <Link to="/auth?mode=signup" className="block">
                <Button className="w-full gradient-xpace">Começar grátis</Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-xl bg-card border hover:border-primary/50 transition-all">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Para grandes escolas e redes</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Alunos ilimitados</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unidades ilimitadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Todos os recursos do Pro</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Suporte prioritário</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Treinamento personalizado</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">API personalizada</span>
                </li>
              </ul>
              <a href="mailto:contato@xpacecontrol.com">
                <Button className="w-full" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Fale com a gente
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Form Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4">
          <LeadForm />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container px-4">
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl gradient-xpace p-8 md:p-12 lg:p-20 text-center">
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-4">
                Veja nossos planos
              </h2>
              <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
                Escolha o plano ideal para sua escola e comece hoje mesmo
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/pricing">
                  <Button size="lg" variant="secondary" className="group w-full sm:w-auto">
                    Ver Planos e Preços
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20">
                    Começar Grátis
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border text-foreground py-8 md:py-12">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
              <div className="flex items-center gap-2">
                <img 
                  src="/xpace-black.png" 
                  alt="XPACE Control" 
                  className="h-6 w-auto object-contain dark:hidden" 
                />
                <img 
                  src="/xpace-white.png" 
                  alt="XPACE Control" 
                  className="h-6 w-auto object-contain hidden dark:block" 
                />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground max-w-md">
                Gestão inteligente e moderna para escolas de dança. Controle de presenças, turmas, alunos e pagamentos em uma única plataforma.
              </p>
              <span className="text-xs text-muted-foreground">
                © 2025 XPACE Control. Todos os direitos reservados.
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-end text-center">
                <a href="#funcionalidades" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Funcionalidades
                </a>
                <a href="#depoimentos" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Depoimentos
                </a>
                <Link to="/pricing" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Preços
                </Link>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-end text-center">
                <Link to="/termos" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Termos de Uso
                </Link>
                <Link to="/privacidade" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacidade
                </Link>
                <a href="mailto:contato@xpacecontrol.com" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Suporte
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default Index;
