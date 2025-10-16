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

    console.log('Running class reminders cron job...');

    // Buscar todas as escolas
    const { data: schools } = await supabase
      .from('schools')
      .select('id, name');

    if (!schools) return new Response(JSON.stringify({ sent: 0 }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

    let sentCount = 0;

    for (const school of schools) {
      // Buscar aulas que começam em 1 hora
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const dayOfWeek = oneHourLater.getDay();
      const timeStr = oneHourLater.toTimeString().substring(0, 5); // HH:MM

      const { data: schedules } = await supabase
        .from('class_schedules')
        .select(`
          class_id,
          classes!inner (
            id,
            name,
            school_id
          )
        `)
        .eq('day_of_week', dayOfWeek)
        .eq('start_time', timeStr)
        .eq('classes.school_id', school.id);

      if (!schedules || schedules.length === 0) continue;

      // Para cada aula, buscar alunos matriculados
      for (const schedule of schedules) {
        const classData = Array.isArray(schedule.classes) ? schedule.classes[0] : schedule.classes;
        if (!classData) continue;

        const { data: enrollments } = await supabase
          .from('class_students')
          .select(`
            students!inner (
              id,
              full_name,
              phone
            )
          `)
          .eq('class_id', schedule.class_id);

        if (!enrollments) continue;

        // Enviar lembretes
        for (const enrollment of enrollments) {
          const studentData = Array.isArray(enrollment.students) ? enrollment.students[0] : enrollment.students;
          if (!studentData || !studentData.phone) continue;

          const message = `🕺 Lembrete: Sua aula de ${classData.name} começa em 1 hora! Não esqueça! 💃`;

          // Enfileirar mensagem WhatsApp
          await supabase
            .from('whatsapp_messages')
            .insert({
              phone: studentData.phone,
              message,
              student_id: studentData.id,
              type: 'class_reminder',
              status: 'pending'
            });

          sentCount++;
          console.log(`Reminder queued for ${studentData.full_name}`);
        }
      }
    }

    console.log(`Total reminders sent: ${sentCount}`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in class reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
