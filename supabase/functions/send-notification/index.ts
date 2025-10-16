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
    const { studentId, notificationType, message } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has notifications enabled
    const { data: profile } = await supabase
      .from("profiles")
      .select("notifications_enabled, email_on_absence, email_on_late_payment")
      .eq("id", user.id)
      .single();

    if (!profile?.notifications_enabled) {
      return new Response(
        JSON.stringify({ success: false, message: "Notificações desativadas" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check specific notification type preference
    if (
      (notificationType === "absence" && !profile.email_on_absence) ||
      (notificationType === "late_payment" && !profile.email_on_late_payment)
    ) {
      return new Response(
        JSON.stringify({ success: false, message: `Notificações de ${notificationType} desativadas` }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log notification (mock email sending for MVP)
    const { error: logError } = await supabase
      .from("notifications_log")
      .insert({
        user_id: user.id,
        student_id: studentId,
        notification_type: notificationType,
        message: message,
        status: "sent",
      });

    if (logError) {
      console.error("Error logging notification:", logError);
      throw logError;
    }

    // In production, this would send actual email via Resend or similar service
    console.log(`[MOCK EMAIL] To: ${user.email}`);
    console.log(`[MOCK EMAIL] Subject: Notificação Xpace Control - ${notificationType}`);
    console.log(`[MOCK EMAIL] Message: ${message}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificação enviada com sucesso (mock)",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
