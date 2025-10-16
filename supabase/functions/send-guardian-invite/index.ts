import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GuardianInviteRequest {
  guardianEmail: string;
  studentId: string;
  schoolId: string;
}

function validateGuardianInvite(data: any): { valid: boolean; error?: string; data?: GuardianInviteRequest } {
  // Validate email
  if (!data.guardianEmail || typeof data.guardianEmail !== 'string') {
    return { valid: false, error: 'Email inválido' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.guardianEmail) || data.guardianEmail.length > 255) {
    return { valid: false, error: 'Email inválido' };
  }

  // Validate studentId (UUID)
  if (!data.studentId || typeof data.studentId !== 'string') {
    return { valid: false, error: 'ID do aluno inválido' };
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.studentId)) {
    return { valid: false, error: 'ID do aluno inválido' };
  }

  // Validate schoolId (UUID)
  if (!data.schoolId || typeof data.schoolId !== 'string') {
    return { valid: false, error: 'ID da escola inválido' };
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.schoolId)) {
    return { valid: false, error: 'ID da escola inválido' };
  }

  return {
    valid: true,
    data: {
      guardianEmail: data.guardianEmail.toLowerCase().trim(),
      studentId: data.studentId,
      schoolId: data.schoolId
    }
  };
}

function sanitizeText(text: string): string {
  return text.replace(/[<>"']/g, '');
}

function getGenericErrorMessage(error: any): string {
  if (error.message?.includes('not found')) {
    return 'Recurso não encontrado';
  }
  if (error.message?.includes('permission') || error.message?.includes('access')) {
    return 'Acesso negado';
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
    const validation = validateGuardianInvite(requestData);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { guardianEmail, studentId, schoolId } = validation.data!;

    // Verify user is admin of the school
    const { data: school } = await supabaseClient
      .from('schools')
      .select('id, name')
      .eq('id', schoolId)
      .eq('admin_id', user.id)
      .maybeSingle();

    if (!school) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Verify student belongs to school
    const { data: student } = await supabaseClient
      .from('students')
      .select('id, full_name')
      .eq('id', studentId)
      .eq('school_id', school.id)
      .maybeSingle();

    if (!student) {
      return new Response(
        JSON.stringify({ error: 'Aluno não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check for duplicate pending invites (prevent spam)
    const { data: existingInvite } = await supabaseClient
      .from('guardian_invites')
      .select('id')
      .eq('guardian_email', guardianEmail)
      .eq('student_id', studentId)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: 'Convite já enviado recentemente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // Generate secure token and expiration
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite record in database
    const { data: invite, error: inviteError } = await supabaseClient
      .from('guardian_invites')
      .insert({
        student_id: studentId,
        school_id: schoolId,
        invited_by: user.id,
        guardian_email: guardianEmail,
        token: token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error('[Guardian Invite] Database error:', { code: inviteError.code, timestamp: new Date().toISOString() });
      throw inviteError;
    }

    // Sanitize names for safe display
    const sanitizedStudentName = sanitizeText(student.full_name);
    const sanitizedSchoolName = sanitizeText(school.name);

    // TODO: Integrate with email service (Resend, SendGrid, etc)
    const frontendUrl = Deno.env.get('FRONTEND_URL') || supabaseUrl.replace('//', '//app.');
    const inviteUrl = `${frontendUrl}/guardian/aceitar-convite/${token}`;
    
    const message = `
      Olá! Você foi convidado para acompanhar o aluno ${sanitizedStudentName} na plataforma ${sanitizedSchoolName}.
      
      Acesse: ${inviteUrl}
      
      Este convite é válido por 7 dias.
      
      Após criar sua conta, você poderá:
      - Ver frequência e notas
      - Acompanhar pagamentos
      - Receber notificações
    `;

    console.log('[Guardian Invite] Invite created:', { 
      inviteId: invite.id, 
      email: guardianEmail, 
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString() 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso!',
        inviteId: invite.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('[Guardian Invite] Error:', { timestamp: new Date().toISOString() });
    
    return new Response(
      JSON.stringify({ error: getGenericErrorMessage(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
