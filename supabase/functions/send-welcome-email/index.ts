import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  leadId: string;
  email: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, email }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', email, 'for lead:', leadId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lead info
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('school_name, city')
      .eq('id', leadId)
      .single();

    if (leadError) {
      console.error('Error fetching lead:', leadError);
      throw leadError;
    }

    // Mock email sending (in production, use Resend or similar service)
    const emailContent = {
      from: 'Xpace Control <contato@xpace.com>',
      to: email,
      subject: 'Bem-vindo ao Xpace Control!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6324b2;">Bem-vindo ao Xpace Control!</h1>
          <p>Olá, <strong>${lead.school_name}</strong>!</p>
          <p>Obrigado pelo seu interesse em conhecer o Xpace Control, a plataforma completa de gestão para escolas de dança.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #6324b2; margin-top: 0;">Por que escolher o Xpace?</h2>
            <ul style="line-height: 1.8;">
              <li>✅ Controle de presenças via QR Code</li>
              <li>✅ Gestão de pagamentos e inadimplência</li>
              <li>✅ Comunicação automática com alunos e responsáveis</li>
              <li>✅ Relatórios e analytics em tempo real</li>
              <li>✅ CRM integrado para captação de novos alunos</li>
            </ul>
          </div>

          <p>Estamos localizados em <strong>${lead.city}</strong> e queremos ajudar você a transformar a gestão da sua escola!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://xpace.com/agendar-demo" 
               style="background-color: #6324b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Agende uma Demo Gratuita
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Em breve, nossa equipe entrará em contato para agendar uma apresentação personalizada.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Xpace Control - Gestão Inteligente para Escolas de Dança<br>
            Se você não solicitou este email, pode ignorá-lo com segurança.
          </p>
        </div>
      `,
    };

    console.log('Mock email content:', emailContent);

    // Log the notification in the database
    const { error: notificationError } = await supabase
      .from('notifications_log')
      .insert({
        user_id: leadId, // Using leadId as user_id for demo purposes
        notification_type: 'email',
        message: `Email de boas-vindas enviado para ${email}`,
        status: 'sent',
      });

    if (notificationError) {
      console.error('Error logging notification:', notificationError);
    }

    // In a production environment, you would actually send the email here
    // using a service like Resend:
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    // await resend.emails.send(emailContent);

    console.log('Welcome email mock sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent (mock)',
        emailContent: emailContent.subject,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in send-welcome-email function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
