import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, customerLabel } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a photo labeling assistant for HVAC installation jobs. When shown a photo, identify what the photo shows (e.g., electric panel, furnace, water heater, tankless unit, heat pump, ductwork, venting, thermostat, gas line, serial number plate, model number, etc.).

Return ONLY a short descriptive label. Examples:
- "Electric Panel"
- "Existing Furnace" 
- "Tankless Water Heater - Serial Number"
- "Heat Pump - Outdoor Unit"
- "Venting Location"
- "Gas Meter"
- "Thermostat"
- "Ductwork"

If the image is a document or invoice, label it as "Invoice" or "Document".
If you cannot identify the content, label it as "Job Site Photo".
Do NOT include the customer name or address in the label - just describe what's in the photo.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: `Customer: ${customerLabel}. What does this photo show? Return only the label.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI labeling failed");
    }

    const data = await response.json();
    const rawLabel = data.choices?.[0]?.message?.content?.trim() || "Job Site Photo";
    
    // Prepend customer info to label: "John Smith, 123 Main St, Hamilton ON - Electric Panel"
    const fullLabel = `${customerLabel} - ${rawLabel}`;

    return new Response(JSON.stringify({ label: fullLabel, rawLabel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("label-photo error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
