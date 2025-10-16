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

    const { phone, message, studentId, type } = await req.json();

    // Salvar mensagem no banco
    const { data: msgData, error: msgError } = await supabase
      .from('whatsapp_messages')
      .insert({
        phone,
        message,
        student_id: studentId,
        type,
        status: 'pending'
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Aqui você integraria com API do WhatsApp (Twilio, Evolution, etc)
    // Por enquanto, apenas simulamos o envio
    console.log('WhatsApp message queued:', { phone, message, type });

    // Atualizar status para 'sent' (em produção, isso seria feito após confirmação da API)
    await supabase
      .from('whatsapp_messages')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', msgData.id);

    return new Response(
      JSON.stringify({ success: true, messageId: msgData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
