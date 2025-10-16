import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground mt-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Introdução</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              O Xpace Control está comprometido em proteger sua privacidade. Esta Política de
              Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações
              quando você usa nossa plataforma.
            </p>
            <p>
              Ao usar o Xpace Control, você concorda com a coleta e uso de informações de acordo
              com esta política.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Informações que Coletamos</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>Coletamos as seguintes categorias de informações:</p>
            
            <h4>2.1 Informações Pessoais</h4>
            <ul>
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone</li>
              <li>Dados da escola (nome, endereço, CNPJ)</li>
            </ul>

            <h4>2.2 Informações de Alunos</h4>
            <ul>
              <li>Dados cadastrais dos alunos</li>
              <li>Informações de contato de responsáveis</li>
              <li>Dados de presença e frequência</li>
              <li>Informações de pagamento</li>
            </ul>

            <h4>2.3 Informações Técnicas</h4>
            <ul>
              <li>Endereço IP</li>
              <li>Tipo de navegador e dispositivo</li>
              <li>Páginas visitadas e tempo de acesso</li>
              <li>Dados de uso da plataforma</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Como Usamos suas Informações</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>Utilizamos as informações coletadas para:</p>
            <ul>
              <li>Fornecer e manter nossa plataforma</li>
              <li>Processar transações e enviar notificações relacionadas</li>
              <li>Melhorar e personalizar sua experiência</li>
              <li>Enviar comunicações importantes sobre o serviço</li>
              <li>Gerar relatórios e análises para sua escola</li>
              <li>Detectar e prevenir fraudes e abusos</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Compartilhamento de Informações</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros,
              exceto nas seguintes circunstâncias:
            </p>
            <ul>
              <li>Com seu consentimento explícito</li>
              <li>Para cumprir obrigações legais</li>
              <li>Para proteger nossos direitos e segurança</li>
              <li>Com provedores de serviços que nos auxiliam (ex: hospedagem, pagamentos)</li>
            </ul>
            <p>
              Todos os terceiros com acesso aos dados são contratualmente obrigados a manter a
              confidencialidade e segurança das informações.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Segurança dos Dados</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas
              informações contra acesso não autorizado, alteração, divulgação ou destruição:
            </p>
            <ul>
              <li>Criptografia SSL/TLS para transmissão de dados</li>
              <li>Autenticação segura de usuários</li>
              <li>Backups regulares</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Monitoramento contínuo de segurança</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Seus Direitos (LGPD)</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes
              direitos:
            </p>
            <ul>
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados a outro fornecedor</li>
              <li>Eliminação dos dados pessoais tratados com seu consentimento</li>
              <li>Revogação do consentimento</li>
            </ul>
            <p>
              Para exercer esses direitos, entre em contato conosco através do e-mail:
              <strong> privacidade@xpacecontrol.com.br</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Cookies e Tecnologias Similares</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o
              uso da plataforma e personalizar conteúdo. Você pode controlar o uso de cookies
              através das configurações do seu navegador.
            </p>
            <p>
              Utilizamos Google Analytics e Meta Pixel para análise de uso e marketing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Retenção de Dados</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir as
              finalidades descritas nesta política, a menos que um período de retenção mais longo
              seja exigido ou permitido por lei.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Alterações nesta Política</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você
              sobre quaisquer alterações publicando a nova política nesta página e atualizando a
              data de "última atualização".
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Contato</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Para questões sobre esta Política de Privacidade ou sobre o tratamento de seus dados
              pessoais, entre em contato:
            </p>
            <p>
              <strong>E-mail:</strong> privacidade@xpacecontrol.com.br<br />
              <strong>Suporte:</strong> suporte@xpacecontrol.com.br
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
