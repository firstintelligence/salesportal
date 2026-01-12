import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Use Gemini with vision capabilities to extract ID information
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting information from Ontario identification documents (Driver's License and Ontario Photo ID Card).

Extract the following fields from the ID image:
- First Name
- Last Name  
- Date of Birth (in YYYY-MM-DD format)
- ID Number (the license/card number)
- ID Expiry Date (in YYYY-MM-DD format)
- Address (full street address)
- City
- Province (should be ON for Ontario)
- Postal Code

For Ontario Driver's License:
- The license number is typically a alphanumeric code starting with a letter
- Date of birth is usually labeled as "DOB" or "Date of Birth"
- Expiry date is labeled as "EXP" or "Expires"
- The address includes street, city, postal code

For Ontario Photo ID Card:
- Similar format to driver's license
- Card number format may differ slightly

Return the data in valid JSON format only, with no additional text:
{
  "firstName": "string",
  "lastName": "string", 
  "dateOfBirth": "YYYY-MM-DD or null",
  "idNumber": "string",
  "idExpiry": "YYYY-MM-DD or null",
  "address": "string",
  "city": "string",
  "province": "string",
  "postalCode": "string",
  "idType": "Ontario Driver's License" or "Ontario Photo ID Card",
  "confidence": "high" or "medium" or "low",
  "notes": "any issues or observations about the scan"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all the information from this Ontario ID card. Return only valid JSON.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response from AI
    let extractedData;
    try {
      // Try to extract JSON from the response (it might have markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse ID information from image');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scan-id function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to scan ID' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
