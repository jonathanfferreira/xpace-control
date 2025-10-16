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
    const { reportType, startDate, endDate, classId, schoolName, schoolColor } = await req.json();

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
      .select("id")
      .eq("admin_id", user.id)
      .single();

    if (!school) {
      return new Response(JSON.stringify({ error: "School not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data: any[] = [];
    let title = "";

    if (reportType === "attendance") {
      let query = supabase
        .from("attendances")
        .select(`
          attendance_date,
          marked_at,
          students(full_name),
          classes(name)
        `)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate)
        .order("attendance_date", { ascending: false });

      if (classId) {
        query = query.eq("class_id", classId);
      }

      const { data: attendances } = await query;
      data = attendances || [];
      title = "Relatório de Presenças";
    } else if (reportType === "payments") {
      const { data: payments } = await supabase
        .from("payments")
        .select(`
          due_date,
          amount,
          status,
          paid_date,
          reference_month,
          students(full_name)
        `)
        .gte("due_date", startDate)
        .lte("due_date", endDate)
        .order("due_date", { ascending: false });

      data = payments || [];
      title = "Relatório de Inadimplência";
    } else if (reportType === "enrollments") {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          start_date,
          status,
          students(full_name),
          classes(name)
        `)
        .gte("start_date", startDate)
        .lte("start_date", endDate)
        .order("start_date", { ascending: false });

      data = enrollments || [];
      title = "Evolução de Matrículas";
    }

    // Generate simple HTML for PDF (to be converted by a PDF service or library)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
    }
    .header {
      border-bottom: 3px solid ${schoolColor};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: ${schoolColor};
      margin: 0;
    }
    .school-name {
      font-size: 24px;
      color: #666;
      margin-top: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: ${schoolColor};
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="school-name">${schoolName}</div>
    <div>Período: ${new Date(startDate).toLocaleDateString("pt-BR")} a ${new Date(endDate).toLocaleDateString("pt-BR")}</div>
  </div>
  
  ${reportType === "attendance" ? `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Aluno</th>
          <th>Turma</th>
          <th>Horário</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((row: any) => `
          <tr>
            <td>${new Date(row.attendance_date).toLocaleDateString("pt-BR")}</td>
            <td>${row.students?.full_name || "-"}</td>
            <td>${row.classes?.name || "-"}</td>
            <td>${new Date(row.marked_at).toLocaleTimeString("pt-BR")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : reportType === "payments" ? `
    <table>
      <thead>
        <tr>
          <th>Aluno</th>
          <th>Valor</th>
          <th>Vencimento</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((row: any) => `
          <tr>
            <td>${row.students?.full_name || "-"}</td>
            <td>R$ ${Number(row.amount).toFixed(2)}</td>
            <td>${new Date(row.due_date).toLocaleDateString("pt-BR")}</td>
            <td>${row.status === "paid" ? "Pago" : row.status === "pending" ? "Pendente" : "Atrasado"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : `
    <table>
      <thead>
        <tr>
          <th>Data Matrícula</th>
          <th>Aluno</th>
          <th>Turma</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((row: any) => `
          <tr>
            <td>${new Date(row.start_date).toLocaleDateString("pt-BR")}</td>
            <td>${row.students?.full_name || "-"}</td>
            <td>${row.classes?.name || "-"}</td>
            <td>${row.status}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `}
  
  <div class="footer">
    Gerado em ${new Date().toLocaleString("pt-BR")} - ${schoolName}
  </div>
</body>
</html>
    `;

    // For now, return HTML as base64 (in production, use a PDF generation library)
    const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));

    return new Response(
      JSON.stringify({ 
        pdf: base64Html,
        message: "PDF generated successfully (HTML format)" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
