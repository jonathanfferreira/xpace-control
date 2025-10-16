import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { guardianEmail, studentName, schoolName } = await req.json();

    // Aqui você integraria com serviço de email (Resend, SendGrid, etc)
    // Por enquanto apenas logamos
    console.log('Guardian invite sent:', { guardianEmail, studentName, schoolName });

    const inviteUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/signup`;
    const message = `
      Olá! Você foi convidado para acompanhar o aluno ${studentName} na plataforma ${schoolName}.
      
      Acesse: ${inviteUrl}
      
      Após criar sua conta, você poderá:
      - Ver frequência e notas
      - Acompanhar pagamentos
      - Receber notificações
    `;

    console.log(message);

    return new Response(
      JSON.stringify({ success: true, message: 'Convite enviado com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error sending invite:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
