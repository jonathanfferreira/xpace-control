import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  keywords?: string;
}

export function SEOHead({
  title = "Xpace Control - Sistema de Gestão Completo para Escolas de Dança",
  description = "Transforme a gestão da sua escola de dança com o Xpace Control. Controle de presenças via QR Code, gestão de pagamentos, turmas e alunos em uma plataforma moderna e intuitiva.",
  image = "https://xpacecontrol.com.br/og-image.jpg",
  path = "",
  keywords = "gestão escolas dança, controle presença QR Code, sistema pagamentos escola, gestão alunos turmas, software escola dança",
}: SEOHeadProps) {
  const url = `https://xpacecontrol.com.br${path}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Xpace Control" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
