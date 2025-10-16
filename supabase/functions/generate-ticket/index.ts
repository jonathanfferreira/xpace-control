import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId } = await req.json();

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

    // Get ticket with event details
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        events(title, event_date, location),
        students(full_name)
      `)
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate QR code for ticket validation
    const qrCodeData = `TICKET:${ticketId}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeData);

    // Get school info for branding
    const { data: eventWithSchool } = await supabase
      .from("events")
      .select("school_id, schools!inner(name, primary_color)")
      .eq("id", ticket.event_id)
      .single();

    const schoolData: any = eventWithSchool?.schools;
    const schoolName = schoolData?.name || "Xpace Control";
    const schoolColor = schoolData?.primary_color || "#6324b2";

    // Generate simple HTML ticket
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    .ticket {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border: 2px solid ${schoolColor};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, ${schoolColor}, ${schoolColor}dd);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .school {
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      border-bottom: 1px solid #eee;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      color: #666;
    }
    .value {
      color: #333;
      text-align: right;
    }
    .qr-section {
      text-align: center;
      padding: 30px;
      background: #f9f9f9;
      margin-top: 20px;
    }
    .qr-section h3 {
      margin-bottom: 15px;
      color: #666;
    }
    .qr-code {
      display: inline-block;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      background: ${ticket.status === "paid" ? "#22c55e" : "#eab308"};
      color: white;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>${ticket.events?.title || "Evento"}</h1>
      <div class="school">${schoolName}</div>
    </div>
    
    <div class="content">
      <div class="info-row">
        <span class="label">Comprador</span>
        <span class="value">${ticket.buyer_name}</span>
      </div>
      
      ${ticket.students ? `
      <div class="info-row">
        <span class="label">Aluno</span>
        <span class="value">${ticket.students.full_name}</span>
      </div>
      ` : ""}
      
      <div class="info-row">
        <span class="label">Data do Evento</span>
        <span class="value">${new Date(ticket.events?.event_date || "").toLocaleString("pt-BR")}</span>
      </div>
      
      ${ticket.events?.location ? `
      <div class="info-row">
        <span class="label">Local</span>
        <span class="value">${ticket.events.location}</span>
      </div>
      ` : ""}
      
      <div class="info-row">
        <span class="label">Valor</span>
        <span class="value">R$ ${Number(ticket.amount).toFixed(2)}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Status</span>
        <span class="value">
          <span class="status-badge">
            ${ticket.status === "paid" ? "PAGO" : "RESERVADO"}
          </span>
        </span>
      </div>
    </div>
    
    <div class="qr-section">
      <h3>Código de Validação</h3>
      <div class="qr-code">
        <img src="${qrCodeDataURL}" alt="QR Code" width="200" height="200" />
      </div>
      <p style="margin-top: 10px; color: #666; font-size: 12px;">
        Apresente este código na entrada do evento
      </p>
    </div>
    
    <div class="footer">
      Ingresso gerado em ${new Date().toLocaleString("pt-BR")}<br>
      ID: ${ticketId.substring(0, 8)}
    </div>
  </div>
</body>
</html>
    `;

    // Return HTML as base64 for PDF generation on client
    const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));

    return new Response(
      JSON.stringify({ 
        html: base64Html,
        message: "Ticket generated successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-ticket:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
