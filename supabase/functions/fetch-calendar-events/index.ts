import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map agent IDs to their Google Calendar IDs
const AGENT_CALENDARS: Record<string, string> = {
  "MM23": Deno.env.get("CALENDAR_ID_MM23") || "",
  "TB0195": Deno.env.get("CALENDAR_ID_TB0195") || "",
  "AA9097": Deno.env.get("CALENDAR_ID_AA9097") || "",
  "HB6400": Deno.env.get("CALENDAR_ID_HB6400") || "",
  "TP5142": Deno.env.get("CALENDAR_ID_TP5142") || "",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { agentId, startDate, endDate } = await req.json();

    if (!agentId) {
      throw new Error("Agent ID is required");
    }

    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) {
      throw new Error("Google service account key not configured");
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    // Get calendar IDs to fetch
    let calendarIds: string[] = [];
    if (agentId === "MM23") {
      // Admin sees all calendars
      calendarIds = Object.values(AGENT_CALENDARS).filter(id => id);
    } else {
      // Regular agent sees only their calendar
      const calendarId = AGENT_CALENDARS[agentId];
      if (!calendarId) {
        throw new Error(`No calendar configured for agent ${agentId}`);
      }
      calendarIds = [calendarId];
    }

    // Generate JWT for Google API authentication
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const header = {
      alg: "RS256",
      typ: "JWT",
    };

    const claimSet = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: expiry,
      iat: now,
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedClaimSet = btoa(JSON.stringify(claimSet));
    const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

    // Import private key
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      new TextEncoder().encode(serviceAccount.private_key),
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    // Sign the JWT
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      new TextEncoder().encode(signatureInput)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${signatureInput}.${encodedSignature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch events from all relevant calendars
    const allEvents: any[] = [];
    
    for (const calendarId of calendarIds) {
      const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
      eventsUrl.searchParams.append("timeMin", startDate);
      eventsUrl.searchParams.append("timeMax", endDate);
      eventsUrl.searchParams.append("singleEvents", "true");
      eventsUrl.searchParams.append("orderBy", "startTime");

      const eventsResponse = await fetch(eventsUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const eventsData = await eventsResponse.json();
      
      if (eventsData.items) {
        allEvents.push(...eventsData.items.map((event: any) => ({
          ...event,
          calendarId, // Tag each event with its calendar ID
        })));
      }
    }

    return new Response(
      JSON.stringify({ events: allEvents }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
