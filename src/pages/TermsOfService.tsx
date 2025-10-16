import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Termos de Uso
          </h1>
          <p className="text-muted-foreground mt-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Aceitação dos Termos</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Ao acessar e usar o Xpace Control, você concorda em cumprir e estar vinculado a estes
              Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá usar
              nossa plataforma.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Descrição do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              O Xpace Control é uma plataforma de gestão para escolas de dança que oferece:
            </p>
            <ul>
              <li>Sistema de controle de presenças via QR Code</li>
              <li>Gestão de pagamentos e cobranças</li>
              <li>Gerenciamento de alunos, turmas e professores</li>
              <li>Geração de relatórios e analytics</li>
              <li>Sistema de eventos e ingressos</li>
              <li>Notificações automáticas e análise com IA</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Conta de Usuário</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Para usar o Xpace Control, você deve criar uma conta fornecendo informações precisas e
              completas. Você é responsável por:
            </p>
            <ul>
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Todas as atividades que ocorram em sua conta</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Planos e Pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              O Xpace Control oferece diferentes planos de assinatura com recursos variados.
              Os pagamentos são processados mensalmente e devem estar em dia para manter o acesso
              aos recursos da plataforma.
            </p>
            <p>
              Oferecemos um período de teste gratuito de 15 dias para novos usuários.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Uso Aceitável</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>Você concorda em não:</p>
            <ul>
              <li>Usar a plataforma para qualquer finalidade ilegal</li>
              <li>Tentar obter acesso não autorizado a qualquer parte da plataforma</li>
              <li>Interferir ou interromper a integridade ou desempenho da plataforma</li>
              <li>Compartilhar seu acesso com terceiros não autorizados</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Propriedade Intelectual</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Todo o conteúdo, recursos e funcionalidades do Xpace Control são de propriedade
              exclusiva da plataforma e estão protegidos por leis de direitos autorais e outras
              leis de propriedade intelectual.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Limitação de Responsabilidade</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              O Xpace Control é fornecido "como está" e "conforme disponível". Não garantimos que
              o serviço será ininterrupto, livre de erros ou completamente seguro.
            </p>
            <p>
              Em nenhuma circunstância seremos responsáveis por danos indiretos, incidentais,
              especiais ou consequenciais resultantes do uso ou incapacidade de usar a plataforma.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Modificações dos Termos</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Reservamos o direito de modificar estes Termos de Uso a qualquer momento.
              Notificaremos os usuários sobre mudanças significativas por e-mail ou através da
              plataforma. O uso continuado após as mudanças constitui aceitação dos novos termos.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Contato</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Para questões sobre estes Termos de Uso, entre em contato conosco através do e-mail:
              <br />
              <strong>suporte@xpacecontrol.com.br</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
