import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleSheetsAuth {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Helper function for URL-safe base64 encoding
function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64urlEncode(binary);
}

async function getAccessToken(credentials: GoogleSheetsAuth): Promise<string> {
  const jwtHeader = base64urlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = base64urlEncode(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const signatureInput = `${jwtHeader}.${jwtClaimSet}`;
  
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(credentials.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureBase64 = arrayBufferToBase64Url(signature);
  const jwt = `${signatureInput}.${signatureBase64}`;

  console.log('JWT generated, exchanging for access token...');

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed:', errorText);
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  console.log('Successfully obtained access token');
  return tokenData.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  try {
    // Log the first 100 chars to debug (without exposing the full key)
    console.log('Private key preview (first 100 chars):', pem.substring(0, 100));
    console.log('Private key length:', pem.length);
    
    // Handle both literal \n and actual newlines
    let normalizedPem = pem;
    
    // If the key has literal \n strings, replace them with actual newlines
    if (pem.includes('\\n')) {
      normalizedPem = pem.replace(/\\n/g, '\n');
      console.log('Replaced literal \\n with newlines');
    }
    
    // Remove PEM headers/footers and all whitespace
    const b64 = normalizedPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '')
      .trim();
    
    console.log('Base64 string length after cleanup:', b64.length);
    
    if (!b64 || b64.length < 100) {
      throw new Error(`Private key is too short after processing (${b64.length} chars). Original key length: ${pem.length}`);
    }
    
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    console.log('Successfully converted private key to ArrayBuffer');
    return bytes.buffer;
  } catch (error) {
    console.error('Failed to process private key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Invalid private key format: ${errorMessage}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_SHEETS_PRIVATE_KEY = Deno.env.get('GOOGLE_SHEETS_PRIVATE_KEY');
    const GOOGLE_SHEETS_CLIENT_EMAIL = Deno.env.get('GOOGLE_SHEETS_CLIENT_EMAIL');
    const GOOGLE_SHEETS_SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GOOGLE_SHEETS_PRIVATE_KEY || !GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new Error('Google Sheets credentials not configured. Required: GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_SPREADSHEET_ID');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    // Parse request body to require a specific record ID
    let specificRecordId: string | null = null;
    try {
      const body = await req.json();
      specificRecordId = body?.recordId ?? null;
    } catch {
      // No body or invalid JSON
    }

    if (!specificRecordId) {
      console.log('No specific recordId provided; aborting Google Sheets sync to avoid unintended bulk updates.');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'recordId is required when calling sync-to-google-sheets',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch only the specific TPV request from database
    let query = supabase
      .from('tpv_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (specificRecordId) {
      query = query.eq('id', specificRecordId);
      console.log(`Fetching specific record: ${specificRecordId}`);
    }

    const { data: tpvRequests, error: dbError } = await query;

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to fetch TPV requests: ${dbError.message}`);
    }

    console.log(`Fetched ${tpvRequests?.length || 0} TPV requests from database`);

    // Prepare Google Sheets auth object
    const sheetsAuth: GoogleSheetsAuth = {
      type: 'service_account',
      project_id: 'workify-477500',
      private_key_id: '',
      private_key: GOOGLE_SHEETS_PRIVATE_KEY,
      client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
      client_id: '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: '',
    };

    // Get access token
    const accessToken = await getAccessToken(sheetsAuth);

    // Function to format date in Toronto timezone
    const formatTorontoTime = (dateString: string | null) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        timeZone: 'America/Toronto',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    };

    // Prepare data for Google Sheets
    const headers = [
      'Date',
      'Agent ID',
      'Customer Name',
      'Customer Phone',
      'Address',
      'City',
      'Province',
      'Postal Code',
      'Email',
      'Products',
      'Sales Price',
      'Interest Rate',
      'Promotional Term',
      'Amortization',
      'Monthly Payment',
      'Status',
      'Call Duration (seconds)',
      'Ended Reason',
      'Call ID',
      'Recording URL'
    ];

    const rows = tpvRequests?.map(request => [
      formatTorontoTime(request.created_at),
      request.agent_id,
      request.customer_name,
      request.customer_phone,
      request.customer_address,
      request.city || '',
      request.province || '',
      request.postal_code || '',
      request.email || '',
      request.products || '',
      request.sales_price || '',
      request.interest_rate || '',
      request.promotional_term || '',
      request.amortization || '',
      request.monthly_payment || '',
      request.status,
      request.call_duration_seconds !== null ? request.call_duration_seconds.toString() : '0',
      request.ended_reason || '',
      request.vapi_call_id || '',
      request.recording_url || ''
    ]) || [];

    // Check if headers exist in the sheet
    const checkResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/Sheet1!A1:T1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const checkData = await checkResponse.json();
    const hasHeaders = checkData.values && checkData.values.length > 0;

    // If no headers exist, write them first
    if (!hasHeaders) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/Sheet1!A1?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [headers],
          }),
        }
      );
    }

    // Get all existing rows to check if this Call ID already exists
    const allRowsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/Sheet1!A2:T`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    let result;
    const allRowsData = await allRowsResponse.json();
    const existingRows = allRowsData.values || [];
    
    // Find the row index for this Call ID (column S = index 18 for Call ID)
    const callIdToSync = rows[0]?.[18]; // Call ID is at index 18
    const existingRowIndex = existingRows.findIndex(row => row[18] === callIdToSync);

    if (existingRowIndex !== -1 && callIdToSync) {
      // Update existing row (add 2 because: 1 for header row + 1 for 1-based indexing)
      const rowNumber = existingRowIndex + 2;
      console.log(`Updating existing row ${rowNumber} for Call ID: ${callIdToSync}`);
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/Sheet1!A${rowNumber}:T${rowNumber}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: rows,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API error:', errorText);
        throw new Error(`Failed to update Google Sheets: ${errorText}`);
      }

      result = await response.json();
      console.log('Successfully updated row in Google Sheets:', result);
    } else {
      // Append new row if Call ID doesn't exist
      console.log(`Appending new row for Call ID: ${callIdToSync}`);
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}/values/Sheet1!A:T:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: rows,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API error:', errorText);
        throw new Error(`Failed to update Google Sheets: ${errorText}`);
      }

      result = await response.json();
      console.log('Successfully appended row to Google Sheets:', result);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'TPV requests synced to Google Sheets',
        rowsWritten: rows.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in sync-to-google-sheets function:', error);
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
