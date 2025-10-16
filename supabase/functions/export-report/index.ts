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
    const { reportType, startDate, endDate, classId, studentId, schoolName, schoolColor } = await req.json();

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
      
      if (studentId) {
        query = query.eq("student_id", studentId);
      }

      const { data: attendances } = await query;
      data = attendances || [];
      title = "Relatório de Presenças";
    } else if (reportType === "payments") {
      let query = supabase
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

      if (studentId) {
        query = query.eq("student_id", studentId);
      }

      const { data: payments } = await query;

      data = payments || [];
      title = "Relatório de Inadimplência";
    } else if (reportType === "enrollments") {
      let query = supabase
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

      if (classId) {
        query = query.eq("class_id", classId);
      }
      
      if (studentId) {
        query = query.eq("student_id", studentId);
      }

      const { data: enrollments } = await query;

      data = enrollments || [];
      title = "Evolução de Matrículas";
    }

    // Generate enhanced HTML for PDF with XPACE branding
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 40px;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 4px solid ${schoolColor};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-left {
      flex: 1;
    }
    .logo {
      width: 120px;
      height: auto;
    }
    h1 {
      color: ${schoolColor};
      margin: 10px 0 5px 0;
      font-size: 28px;
      font-weight: 600;
    }
    .school-name {
      font-size: 18px;
      color: #666;
      margin: 5px 0;
    }
    .period {
      font-size: 14px;
      color: #888;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background: linear-gradient(135deg, ${schoolColor} 0%, ${schoolColor}dd 100%);
      color: white;
      padding: 14px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e5e5;
      font-size: 14px;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-paid {
      background-color: #dcfce7;
      color: #166534;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-active {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e5e5;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    .footer-brand {
      color: ${schoolColor};
      font-weight: 600;
      margin-top: 5px;
    }
    .summary {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      display: flex;
      gap: 30px;
    }
    .summary-item {
      flex: 1;
    }
    .summary-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: ${schoolColor};
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${title}</h1>
      <div class="school-name">${schoolName}</div>
      <div class="period">Período: ${new Date(startDate).toLocaleDateString("pt-BR")} a ${new Date(endDate).toLocaleDateString("pt-BR")}</div>
    </div>
    <div class="header-right">
      <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="40" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${schoolColor}">XPACE</text>
        <text x="12" y="55" font-family="Arial, sans-serif" font-size="10" fill="#666">Control</text>
      </svg>
    </div>
  </div>
  
  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total de Registros</div>
      <div class="summary-value">${data.length}</div>
    </div>
    ${reportType === "payments" ? `
      <div class="summary-item">
        <div class="summary-label">Valor Total</div>
        <div class="summary-value">R$ ${data.reduce((sum: number, row: any) => sum + Number(row.amount), 0).toFixed(2)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Pagos</div>
        <div class="summary-value">${data.filter((r: any) => r.status === "paid").length}</div>
      </div>
    ` : ""}
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
            <td>${new Date(row.marked_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
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
          <th>Data Pagamento</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((row: any) => `
          <tr>
            <td>${row.students?.full_name || "-"}</td>
            <td>R$ ${Number(row.amount).toFixed(2)}</td>
            <td>${new Date(row.due_date).toLocaleDateString("pt-BR")}</td>
            <td>
              <span class="status-badge ${row.status === "paid" ? "status-paid" : "status-pending"}">
                ${row.status === "paid" ? "Pago" : "Pendente"}
              </span>
            </td>
            <td>${row.paid_date ? new Date(row.paid_date).toLocaleDateString("pt-BR") : "-"}</td>
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
            <td>
              <span class="status-badge status-active">
                ${row.status}
              </span>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `}
  
  <div class="footer">
    <div>Gerado em ${new Date().toLocaleString("pt-BR")}</div>
    <div class="footer-brand">Powered by XPACE Control - ${schoolName}</div>
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
