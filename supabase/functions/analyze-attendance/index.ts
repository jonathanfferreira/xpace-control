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
      .select("id")
      .eq("admin_id", user.id)
      .single();

    if (!school) {
      return new Response(JSON.stringify({ error: "School not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get students with attendance data
    const { data: students } = await supabase
      .from("students")
      .select(`
        id,
        full_name,
        email
      `)
      .eq("school_id", school.id)
      .eq("active", true);

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ alerts: [], message: "Nenhum aluno encontrado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get attendance data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: attendances } = await supabase
      .from("attendances")
      .select("student_id, attendance_date")
      .gte("attendance_date", thirtyDaysAgo.toISOString().split("T")[0]);

    // Calculate attendance rate for each student
    const studentStats = students.map((student) => {
      const studentAttendances = attendances?.filter((a) => a.student_id === student.id) || [];
      const attendanceRate = studentAttendances.length > 0 
        ? (studentAttendances.length / 30) * 100 
        : 0;

      return {
        name: student.full_name,
        email: student.email,
        attendanceRate: Math.round(attendanceRate),
        attendanceCount: studentAttendances.length,
      };
    });

    // Prepare data for AI analysis
    const analyticsData = {
      totalStudents: students.length,
      studentsWithLowAttendance: studentStats.filter(s => s.attendanceRate < 60).length,
      averageAttendanceRate: Math.round(
        studentStats.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length
      ),
      lowPerformers: studentStats
        .filter(s => s.attendanceRate < 60)
        .map(s => `${s.name}: ${s.attendanceRate}%`)
        .slice(0, 5),
    };

    // Call Lovable AI for analysis
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
            content: "Você é um assistente de análise educacional. Analise dados de presença e forneça insights acionáveis em português.",
          },
          {
            role: "user",
            content: `Analise os seguintes dados de presença dos últimos 30 dias:

Total de alunos: ${analyticsData.totalStudents}
Taxa média de presença: ${analyticsData.averageAttendanceRate}%
Alunos com presença abaixo de 60%: ${analyticsData.studentsWithLowAttendance}

${analyticsData.lowPerformers.length > 0 ? `Alunos com baixa frequência:\n${analyticsData.lowPerformers.join('\n')}` : ''}

Forneça 3-5 alertas ou sugestões específicas para melhorar a frequência. Seja objetivo e prático.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const aiAnalysis = aiData.choices?.[0]?.message?.content || "Nenhuma análise disponível";

    // Create alerts for low attendance students
    const alerts = studentStats
      .filter(s => s.attendanceRate < 60)
      .map(s => ({
        type: "low_attendance",
        student: s.name,
        email: s.email,
        message: `${s.name} tem taxa de presença de apenas ${s.attendanceRate}% (${s.attendanceCount} presenças nos últimos 30 dias)`,
        severity: s.attendanceRate < 40 ? "high" : "medium",
      }));

    return new Response(
      JSON.stringify({
        alerts,
        aiAnalysis,
        stats: analyticsData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in analyze-attendance:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
