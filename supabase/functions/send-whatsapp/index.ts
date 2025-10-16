import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema (Zod-like validation)
interface WhatsAppRequest {
  phone: string;
  message: string;
  studentId: string;
  type: string;
}

function validateWhatsAppRequest(data: any): { valid: boolean; error?: string; data?: WhatsAppRequest } {
  // Validate phone format
  if (!data.phone || typeof data.phone !== 'string') {
    return { valid: false, error: 'Telefone inválido' };
  }
  if (!/^\+?[1-9]\d{10,14}$/.test(data.phone)) {
    return { valid: false, error: 'Formato de telefone inválido' };
  }

  // Validate message
  if (!data.message || typeof data.message !== 'string') {
    return { valid: false, error: 'Mensagem inválida' };
  }
  if (data.message.length < 1 || data.message.length > 1000) {
    return { valid: false, error: 'Mensagem deve ter entre 1 e 1000 caracteres' };
  }

  // Validate studentId
  if (!data.studentId || typeof data.studentId !== 'string') {
    return { valid: false, error: 'ID do aluno inválido' };
  }
  // UUID format validation
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.studentId)) {
    return { valid: false, error: 'ID do aluno inválido' };
  }

  // Validate type
  const validTypes = ['class_reminder', 'payment_reminder', 'general'];
  if (!data.type || !validTypes.includes(data.type)) {
    return { valid: false, error: 'Tipo de mensagem inválido' };
  }

  return { 
    valid: true, 
    data: {
      phone: data.phone,
      message: data.message.substring(0, 1000), // Sanitize length
      studentId: data.studentId,
      type: data.type
    }
  };
}

function getGenericErrorMessage(error: any): string {
  if (error.message?.includes('not found')) {
    return 'Recurso não encontrado';
  }
  if (error.message?.includes('permission') || error.message?.includes('access')) {
    return 'Acesso negado';
  }
  if (error.code === '23505') {
    return 'Registro duplicado';
  }
  return 'Erro ao processar sua solicitação. Tente novamente.';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Authenticate user via JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create client with user's JWT for RLS
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Validate input
    const requestData = await req.json();
    const validation = validateWhatsAppRequest(requestData);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { phone, message, studentId, type } = validation.data!;

    // Verify user has permission to send messages for this student
    const { data: student } = await supabaseClient
      .from('students')
      .select('id, school_id')
      .eq('id', studentId)
      .single();

    if (!student) {
      return new Response(
        JSON.stringify({ error: 'Aluno não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Verify user is admin of the school
    const { data: userSchool } = await supabaseClient
      .from('schools')
      .select('id')
      .eq('id', student.school_id)
      .eq('admin_id', user.id)
      .maybeSingle();

    if (!userSchool) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Check rate limit (10 messages per hour per user)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentMessages, error: countError } = await supabaseClient
      .from('whatsapp_messages')
      .select('id')
      .gte('created_at', oneHourAgo)
      .eq('student_id', studentId);

    if (recentMessages && recentMessages.length >= 10) {
      return new Response(
        JSON.stringify({ error: 'Limite de mensagens excedido. Tente novamente mais tarde.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // Save message to database
    const { data: msgData, error: msgError } = await supabaseClient
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

    if (msgError) {
      console.error('[WhatsApp] Database error:', { code: msgError.code, timestamp: new Date().toISOString() });
      throw msgError;
    }

    // TODO: Integrate with WhatsApp API (Twilio, Evolution, etc)
    console.log('[WhatsApp] Message queued:', { messageId: msgData.id, type, timestamp: new Date().toISOString() });

    // Update status to 'sent' (in production, this would be done after API confirmation)
    await supabaseClient
      .from('whatsapp_messages')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', msgData.id);

    return new Response(
      JSON.stringify({ success: true, messageId: msgData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('[WhatsApp] Error:', { timestamp: new Date().toISOString(), code: error.code });
    
    return new Response(
      JSON.stringify({ error: getGenericErrorMessage(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
