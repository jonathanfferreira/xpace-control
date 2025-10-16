import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all schools
    const { data: schools } = await supabase
      .from("schools")
      .select("id, admin_id");

    if (!schools) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notificationsSent = 0;

    for (const school of schools) {
      // Get admin profile to check notification preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("notifications_enabled, email_on_absence, email_on_late_payment")
        .eq("id", school.admin_id)
        .single();

      if (!profile?.notifications_enabled) continue;

      // Check for repeated absences (3 absences in current month)
      if (profile.email_on_absence) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);

        const { data: students } = await supabase
          .from("students")
          .select("id, full_name, email")
          .eq("school_id", school.id)
          .eq("active", true);

        if (students) {
          for (const student of students) {
            // Count absences in current month
            const { count: absenceCount } = await supabase
              .from("attendances")
              .select("*", { count: 'exact', head: true })
              .eq("student_id", student.id)
              .gte("attendance_date", startOfMonth.toISOString().split("T")[0]);

            // Calculate expected classes (assuming 3 classes per week, ~12 per month)
            const daysSinceStart = Math.floor((Date.now() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
            const expectedClasses = Math.floor((daysSinceStart / 7) * 3);
            const actualAbsences = expectedClasses - (absenceCount || 0);

            if (actualAbsences >= 3) {
              // Check if notification already sent this month
              const { data: existingNotification } = await supabase
                .from("notifications_log")
                .select("id")
                .eq("user_id", school.admin_id)
                .eq("student_id", student.id)
                .eq("notification_type", "repeated_absence")
                .gte("sent_at", startOfMonth.toISOString())
                .maybeSingle();

              if (!existingNotification) {
                await supabase.from("notifications_log").insert({
                  user_id: school.admin_id,
                  student_id: student.id,
                  notification_type: "repeated_absence",
                  message: `Alerta: ${student.full_name} teve ${actualAbsences} faltas no mês atual. Entre em contato com o responsável.`,
                  status: "sent",
                });
                notificationsSent++;
                console.log(`[NOTIFICATION] Repeated absence alert for student ${student.full_name}`);
              }
            }
          }
        }
      }

      // Check for late payments (>5 days overdue)
      if (profile.email_on_late_payment) {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const { data: latePayments } = await supabase
          .from("payments")
          .select(`
            id,
            student_id,
            due_date,
            amount,
            students(id, full_name, school_id)
          `)
          .eq("status", "pending")
          .lt("due_date", fiveDaysAgo.toISOString().split("T")[0]);

        if (latePayments) {
          for (const payment of latePayments) {
            // Skip if student is not from this school
            if (!payment.students || (payment.students as any).school_id !== school.id) continue;

            // Check if notification already sent for this payment
            const { data: existingNotification } = await supabase
              .from("notifications_log")
              .select("id")
              .eq("user_id", school.admin_id)
              .eq("student_id", payment.student_id)
              .eq("notification_type", "late_payment")
              .gte("sent_at", fiveDaysAgo.toISOString())
              .maybeSingle();

            if (!existingNotification) {
              const daysLate = Math.floor(
                (Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
              );

              const studentName = (payment.students as any).full_name || 'Aluno';

              await supabase.from("notifications_log").insert({
                user_id: school.admin_id,
                student_id: payment.student_id,
                notification_type: "late_payment",
                message: `Pagamento atrasado: ${studentName} possui pagamento vencido há ${daysLate} dias (R$ ${payment.amount}).`,
                status: "sent",
              });
              notificationsSent++;
              console.log(`[NOTIFICATION] Late payment alert for student ${studentName}`);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
        message: `Processamento concluído. ${notificationsSent} notificações enviadas.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-notification-triggers:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
