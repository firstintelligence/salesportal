import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agent ID to phone number mapping
const AGENT_MAPPING: Record<string, string> = {
  'MM23': '+19059043544',
  'WK8448': '+16476258448',
  'TB0195': '+14168750195',
  'AA9097': '+16477169097',
  'HB6400': '+16473776400',
  // Polaron agents
  'MA11': '+19059043544',
};

// Admin agent who receives all notifications
const ADMIN_AGENT_ID = 'MM23';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio credentials not configured');
    }

    const webhookData = await req.json();
    console.log('VAPI webhook received:', JSON.stringify(webhookData, null, 2));

    // Check if this is a call ended event - handle both old and new VAPI webhook structures
    const isEndOfCall = webhookData.type === 'end-of-call-report' || webhookData.message?.type === 'end-of-call-report';
    
    if (isEndOfCall) {
      // Support both webhook structures
      const callData = webhookData.call || webhookData.message?.call;
      const metadata = callData?.metadata;
      
      const agentId = metadata?.agentId;
      const callStatus = webhookData.endedReason || webhookData.message?.endedReason || callData?.endedReason || 'unknown';
      const customerName = metadata?.customerName || 'Unknown';
      const address = metadata?.address || 'Unknown';
      // Consider call successful if it ended normally AND had sufficient duration (60+ seconds)
      // Short calls (<60s) are likely early hangups before TPV was completed
      const failureReasons = ['failed', 'no-answer', 'busy', 'voicemail', 'error', 'machine-detected', 'silence-timed-out', 'phone-call-provider-closed-websocket'];
      const MIN_SUCCESSFUL_DURATION = 60; // seconds
      const hasMinDuration = callDuration >= MIN_SUCCESSFUL_DURATION;
      const callSuccessful = !failureReasons.includes(callStatus.toLowerCase()) && hasMinDuration;
      const vapiCallId = callData?.id;
      const callDuration = callData?.duration || 0;
      // Extract recording URL from VAPI webhook (message.recordingUrl or message.artifact.recording)
      const recordingUrl = webhookData.message?.recordingUrl || 
                          webhookData.message?.artifact?.recording || 
                          webhookData.recordingUrl || 
                          null;

      console.log('Call ended:', {
        agentId,
        callStatus,
        customerName,
        address,
        callSuccessful,
        vapiCallId,
        callDuration,
        recordingUrl
      });

      // Update database with call results and fetch full record
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      let tpvRecord: any = null;

      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          
          const { data: updateData, error: updateError } = await supabase
            .from('tpv_requests')
            .update({
              status: callSuccessful ? 'completed' : 'failed',
              ended_reason: callStatus,
              call_duration_seconds: Math.floor(callDuration),
              recording_url: recordingUrl,
            })
            .eq('vapi_call_id', vapiCallId)
            .select('*')
            .single();

          if (updateError) {
            console.error('Failed to update TPV request in database:', updateError);
          } else {
            console.log('TPV request updated in database successfully');
            tpvRecord = updateData;
            
            // Trigger Google Sheets sync with the updated record ID
            try {
              const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/sync-to-google-sheets`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  recordId: updateData?.id,
                }),
              });
              
              if (!syncResponse.ok) {
                console.error('Failed to sync to Google Sheets:', await syncResponse.text());
              } else {
                console.log('Successfully synced to Google Sheets');
              }
            } catch (syncError) {
              console.error('Error syncing to Google Sheets:', syncError);
            }
          }
        } catch (dbError) {
          console.error('Error updating database:', dbError);
        }
      }

      // Build list of phone numbers to notify
      const phoneNumbersToNotify: Set<string> = new Set();
      
      // Always add admin (MM23)
      const adminPhone = AGENT_MAPPING[ADMIN_AGENT_ID];
      if (adminPhone) {
        phoneNumbersToNotify.add(adminPhone);
      }
      
      // Add the requesting agent if they exist and are different from admin
      if (agentId && AGENT_MAPPING[agentId]) {
        phoneNumbersToNotify.add(AGENT_MAPPING[agentId]);
      }

      if (phoneNumbersToNotify.size > 0) {
        const statusText = callSuccessful ? '✅ TPV COMPLETED' : '❌ TPV FAILED';
        
        // Build detailed message using tpvRecord if available
        let message = statusText;
        
        if (tpvRecord) {
          // Customer name
          const fullName = tpvRecord.first_name && tpvRecord.last_name 
            ? `${tpvRecord.first_name} ${tpvRecord.last_name}`
            : tpvRecord.customer_name || customerName;
          
          // Full Canadian address format
          const addressParts = [
            tpvRecord.customer_address,
            tpvRecord.city,
            tpvRecord.province,
            tpvRecord.postal_code
          ].filter(Boolean);
          const fullAddress = addressParts.join(', ');
          
          // Format phone number
          const phone = tpvRecord.customer_phone || '';
          const formattedPhone = phone.length === 10 
            ? `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`
            : phone;
          
          // Products list
          const products = tpvRecord.products || 'N/A';
          
          // Payment details - format with commas
          const formatWithCommas = (value: string) => {
            const num = parseFloat(value);
            if (isNaN(num)) return value;
            return num.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          };
          
          const salesPrice = tpvRecord.sales_price ? `$${formatWithCommas(tpvRecord.sales_price)}` : 'N/A';
          const interestRate = tpvRecord.interest_rate || 'N/A';
          const promoTerm = tpvRecord.promotional_term || 'N/A';
          const amortization = tpvRecord.amortization || 'N/A';
          const monthlyPayment = tpvRecord.monthly_payment ? `$${formatWithCommas(tpvRecord.monthly_payment)}` : 'N/A';
          
          message = `${statusText}

👤 Customer: ${fullName}
📞 Phone: ${formattedPhone}
📍 Address: ${fullAddress}

📦 Products: ${products}

💰 Payment Details:
• Amount: ${salesPrice}
• Interest: ${interestRate}
• Promo Term: ${promoTerm}
• Amortization: ${amortization}
• Monthly Payment: ${monthlyPayment}`;

          // Add recording link if available
          if (recordingUrl) {
            message += `\n\n🎙️ Recording: ${recordingUrl}`;
          }
        } else {
          // Fallback to basic message if no record found
          message = `${statusText}\n\nCustomer: ${customerName}\nAddress: ${address}`;
          if (recordingUrl) {
            message += `\n\n🎙️ Recording: ${recordingUrl}`;
          }
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const twilioAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

        // Send SMS to all recipients
        for (const phoneNumber of phoneNumbersToNotify) {
          console.log('Sending SMS to:', phoneNumber);

          try {
            const smsResponse = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${twilioAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: phoneNumber,
                From: TWILIO_PHONE_NUMBER,
                Body: message,
              }),
            });

            if (!smsResponse.ok) {
              const errorText = await smsResponse.text();
              console.error(`Twilio SMS error for ${phoneNumber}:`, errorText);
            } else {
              const smsResult = await smsResponse.json();
              console.log(`SMS sent successfully to ${phoneNumber}:`, smsResult);
            }
          } catch (smsError) {
            console.error(`Error sending SMS to ${phoneNumber}:`, smsError);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Notifications sent to ${phoneNumbersToNotify.size} recipient(s)`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // Return success for all webhook events
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook received',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in vapi-webhook function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
