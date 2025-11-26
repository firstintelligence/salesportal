import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Drive API helper functions
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: exp,
  };

  // Base64URL encode
  const base64UrlEncode = (obj: object) => {
    const json = JSON.stringify(obj);
    const base64 = btoa(json);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key and sign
  const pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${signatureInput}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    console.error('Token error:', tokenData);
    throw new Error('Failed to get access token');
  }

  return tokenData.access_token;
}

async function createFolder(accessToken: string, folderName: string, parentFolderId?: string): Promise<string> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  const data = await response.json();
  if (!data.id) {
    console.error('Create folder error:', data);
    throw new Error('Failed to create folder');
  }

  console.log('Created folder:', folderName, 'ID:', data.id);
  return data.id;
}

async function uploadFile(
  accessToken: string,
  fileName: string,
  fileUrl: string,
  folderId: string
): Promise<string> {
  // Download the image
  const imageResponse = await fetch(fileUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${fileUrl}`);
  }
  const imageBlob = await imageResponse.blob();

  // Create multipart form data
  const boundary = '-------314159265358979323846';
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const metadataString = JSON.stringify(metadata);
  const imageArrayBuffer = await imageBlob.arrayBuffer();
  const imageBytes = new Uint8Array(imageArrayBuffer);

  // Build multipart body
  const encoder = new TextEncoder();
  const metadataPart = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataString}\r\n`
  );
  const imagePart = encoder.encode(
    `--${boundary}\r\nContent-Type: ${imageBlob.type || 'image/jpeg'}\r\n\r\n`
  );
  const endPart = encoder.encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(metadataPart.length + imagePart.length + imageBytes.length + endPart.length);
  body.set(metadataPart, 0);
  body.set(imagePart, metadataPart.length);
  body.set(imageBytes, metadataPart.length + imagePart.length);
  body.set(endPart, metadataPart.length + imagePart.length + imageBytes.length);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body,
  });

  const data = await response.json();
  if (!data.id) {
    console.error('Upload error:', data);
    throw new Error(`Failed to upload file: ${fileName}`);
  }

  console.log('Uploaded file:', fileName, 'ID:', data.id);
  return data.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { checklistId, customerName, customerAddress, province, postalCode, photos } = await req.json();
    console.log('Saving checklist to Drive for:', customerName);

    const GOOGLE_CLIENT_EMAIL = Deno.env.get('GOOGLE_SHEETS_CLIENT_EMAIL');
    const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_SHEETS_PRIVATE_KEY');
    const PARENT_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      throw new Error('Google credentials not configured');
    }

    // Get access token
    const accessToken = await getAccessToken(GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY);
    console.log('Got access token');

    // Create folder with customer name, address, province, and postal code
    const locationParts = [customerAddress, province, postalCode].filter(Boolean).join(', ');
    const folderName = `${customerName} - ${locationParts}`;
    const folderId = await createFolder(accessToken, folderName, PARENT_FOLDER_ID || undefined);

    // Upload each photo
    const uploadedFiles = [];
    for (const photo of photos) {
      const fileName = `${customerName} - ${locationParts} - ${photo.itemName}`;
      // Get file extension from URL or default to jpg
      const extension = photo.photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const fullFileName = `${fileName}.${extension}`;

      try {
        const fileId = await uploadFile(accessToken, fullFileName, photo.photoUrl, folderId);
        uploadedFiles.push({ itemName: photo.itemName, fileId });
      } catch (uploadError) {
        console.error('Failed to upload:', photo.itemName, uploadError);
      }
    }

    console.log('Successfully uploaded', uploadedFiles.length, 'files to Drive');

    return new Response(
      JSON.stringify({ 
        success: true, 
        folderId, 
        folderName,
        uploadedCount: uploadedFiles.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error saving to Drive:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
