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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    // Get school for the user
    const { data: school } = await supabase
      .from("schools")
      .select("id, name")
      .eq("admin_id", user.id)
      .single();

    if (!school) {
      return new Response(JSON.stringify({ error: "School not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get students
    const { data: students } = await supabase
      .from("students")
      .select("id, full_name, email, phone")
      .eq("school_id", school.id)
      .eq("active", true);

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ atRiskStudents: [], message: "Nenhum aluno encontrado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get attendance data for last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: attendances } = await supabase
      .from("attendances")
      .select("student_id, attendance_date")
      .gte("attendance_date", fourWeeksAgo.toISOString().split("T")[0]);

    // Get payment data
    const { data: payments } = await supabase
      .from("payments")
      .select("student_id, status, due_date, paid_date")
      .in("student_id", students.map(s => s.id));

    // Calculate churn risk for each student
    const studentRisks = students.map((student) => {
      const studentAttendances = attendances?.filter((a) => a.student_id === student.id) || [];
      const studentPayments = payments?.filter((p) => p.student_id === student.id) || [];

      // Calculate attendance rate (last 4 weeks, assuming 3 classes per week = 12 total)
      const expectedClasses = 12;
      const attendanceRate = (studentAttendances.length / expectedClasses) * 100;

      // Calculate late payment count (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentPayments = studentPayments.filter(
        p => new Date(p.due_date) >= sixMonthsAgo
      );
      
      const latePaymentCount = recentPayments.filter(p => {
        if (p.status === 'pending' && new Date(p.due_date) < new Date()) return true;
        if (p.status === 'paid' && p.paid_date && new Date(p.paid_date) > new Date(p.due_date)) return true;
        return false;
      }).length;

      // Calculate risk score (0-100, higher = more risk)
      let riskScore = 0;
      
      // Attendance weight: 60%
      riskScore += (100 - attendanceRate) * 0.6;
      
      // Late payments weight: 40%
      const latePaymentScore = Math.min((latePaymentCount / 3) * 100, 100);
      riskScore += latePaymentScore * 0.4;

      return {
        studentId: student.id,
        name: student.full_name,
        email: student.email,
        phone: student.phone,
        riskScore: Math.round(riskScore),
        attendanceRate: Math.round(attendanceRate),
        attendanceCount: studentAttendances.length,
        latePaymentCount,
        riskLevel: riskScore > 60 ? 'high' : riskScore > 40 ? 'medium' : 'low',
      };
    });

    // Filter students at risk (score > 40)
    const atRiskStudents = studentRisks
      .filter(s => s.riskScore > 40)
      .sort((a, b) => b.riskScore - a.riskScore);

    // Use AI to suggest actions for top at-risk students
    let aiSuggestions = "";
    
    if (atRiskStudents.length > 0) {
      const topRisks = atRiskStudents.slice(0, 5);
      
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Você é um consultor especializado em retenção de alunos em escolas de dança. Forneça sugestões práticas e específicas.",
            },
            {
              role: "user",
              content: `Analise os seguintes alunos em risco de evasão e sugira ações específicas para cada um:

${topRisks.map((s, i) => `
${i + 1}. ${s.name}
   - Score de risco: ${s.riskScore}/100
   - Taxa de presença (últimas 4 semanas): ${s.attendanceRate}%
   - Pagamentos atrasados (últimos 6 meses): ${s.latePaymentCount}
`).join('\n')}

Para cada aluno, forneça:
1. Diagnóstico breve do risco
2. Ação imediata sugerida (específica e prática)
3. Estratégia de médio prazo

Seja objetivo e focado em ações concretas.`,
            },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiSuggestions = aiData.choices?.[0]?.message?.content || "";
      }
    }

    return new Response(
      JSON.stringify({
        atRiskStudents,
        totalAtRisk: atRiskStudents.length,
        aiSuggestions,
        stats: {
          totalStudents: students.length,
          highRisk: atRiskStudents.filter(s => s.riskLevel === 'high').length,
          mediumRisk: atRiskStudents.filter(s => s.riskLevel === 'medium').length,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in analyze-churn-risk:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
