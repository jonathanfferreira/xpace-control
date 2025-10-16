import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  try {
    // Parse webhook payload
    const payload = await req.json();
    console.log('Asaas webhook received:', JSON.stringify(payload, null, 2));

    const { event, payment } = payload;

    // Only process payment events
    if (!event || !payment) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find payment by external reference (Asaas payment ID)
    const findRes = await fetch(
      `${supabaseUrl}/rest/v1/payments?payment_reference=eq.${payment.id}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const payments = await findRes.json();

    if (!payments || payments.length === 0) {
      console.log('Payment not found for reference:', payment.id);
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dbPayment = payments[0];

    // Map Asaas payment status to our status
    let newStatus = dbPayment.status;
    let paidDate = dbPayment.paid_date;

    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        newStatus = 'paid';
        paidDate = new Date().toISOString().split('T')[0];
        break;
      case 'PAYMENT_OVERDUE':
        newStatus = 'overdue';
        break;
      case 'PAYMENT_DELETED':
        newStatus = 'cancelled';
        break;
      default:
        console.log('Unhandled event type:', event);
    }

    // Update payment status
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/payments?id=eq.${dbPayment.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          status: newStatus,
          paid_date: paidDate,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error('Error updating payment:', errorText);
      throw new Error(errorText);
    }

    console.log(`Payment ${dbPayment.id} updated to status: ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true, paymentId: dbPayment.id, newStatus }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in asaas-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
