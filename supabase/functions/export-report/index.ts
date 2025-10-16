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
    const { reportType } = await req.json(); // "attendances" or "payments"

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

    // Get school
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

    let csvContent = "";

    if (reportType === "attendances") {
      // Get attendances with student and class info
      const { data: attendances } = await supabase
        .from("attendances")
        .select(`
          id,
          attendance_date,
          marked_at,
          students!inner(full_name),
          classes!inner(name)
        `)
        .order("attendance_date", { ascending: false });

      if (!attendances || attendances.length === 0) {
        csvContent = "Data,Aluno,Turma,Horário de Registro\n";
      } else {
        // Create CSV header
        csvContent = "Data,Aluno,Turma,Horário de Registro\n";

        // Add data rows
        attendances.forEach((att: any) => {
          const date = new Date(att.attendance_date).toLocaleDateString("pt-BR");
          const time = new Date(att.marked_at).toLocaleTimeString("pt-BR");
          csvContent += `${date},${att.students.full_name},${att.classes.name},${time}\n`;
        });
      }
    } else if (reportType === "payments") {
      // Get payments with student info
      const { data: payments } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          due_date,
          paid_date,
          status,
          reference_month,
          students!inner(full_name)
        `)
        .order("due_date", { ascending: false });

      if (!payments || payments.length === 0) {
        csvContent = "Aluno,Valor,Vencimento,Data Pagamento,Status,Mês Referência\n";
      } else {
        // Create CSV header
        csvContent = "Aluno,Valor,Vencimento,Data Pagamento,Status,Mês Referência\n";

        // Add data rows
        payments.forEach((pay: any) => {
          const dueDate = new Date(pay.due_date).toLocaleDateString("pt-BR");
          const paidDate = pay.paid_date 
            ? new Date(pay.paid_date).toLocaleDateString("pt-BR") 
            : "-";
          const refMonth = new Date(pay.reference_month).toLocaleDateString("pt-BR", { 
            month: "long", 
            year: "numeric" 
          });
          const status = pay.status === "paid" ? "Pago" 
            : pay.status === "pending" ? "Pendente" 
            : "Atrasado";

          csvContent += `${pay.students.full_name},R$ ${pay.amount.toFixed(2)},${dueDate},${paidDate},${status},${refMonth}\n`;
        });
      }
    }

    // Return CSV file
    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio_${reportType}_${school.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error in export-report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
