import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Base64 encode helper
function base64Encode(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  const len = data.length;
  for (let i = 0; i < len; i += 3) {
    const a = data[i];
    const b = i + 1 < len ? data[i + 1] : 0;
    const c = i + 2 < len ? data[i + 2] : 0;
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < len ? chars[((b & 15) << 2) | (c >> 6)] : "=";
    result += i + 2 < len ? chars[c & 63] : "=";
  }
  return result;
}

// Generate a random boundary string
function generateBoundary(): string {
  return "----=_Part_" + crypto.randomUUID().replace(/-/g, "");
}

async function sendEmailViaSMTP(
  to: string,
  subject: string,
  htmlBody: string,
  fromEmail: string,
  fromName: string,
  attachments: { filename: string; content: Uint8Array; contentType: string }[]
) {
  const password = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!password) {
    throw new Error("GMAIL_APP_PASSWORD secret is not configured. Please add it in your project secrets.");
  }

  const boundary = generateBoundary();
  const mixedBoundary = generateBoundary();

  // Build MIME message
  let message = "";
  message += `From: ${fromName} <${fromEmail}>\r\n`;
  message += `To: ${to}\r\n`;
  message += `Subject: ${subject}\r\n`;
  message += `MIME-Version: 1.0\r\n`;
  message += `Content-Type: multipart/mixed; boundary="${mixedBoundary}"\r\n`;
  message += `\r\n`;

  // HTML body part
  message += `--${mixedBoundary}\r\n`;
  message += `Content-Type: text/html; charset="UTF-8"\r\n`;
  message += `Content-Transfer-Encoding: 7bit\r\n`;
  message += `\r\n`;
  message += htmlBody + "\r\n";

  // Attachments
  for (const att of attachments) {
    const b64Content = base64Encode(new TextDecoder().decode(att.content));
    // Actually we need raw base64 of binary data
    const rawB64 = btoa(String.fromCharCode(...att.content));
    
    message += `--${mixedBoundary}\r\n`;
    message += `Content-Type: ${att.contentType}; name="${att.filename}"\r\n`;
    message += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
    message += `Content-Transfer-Encoding: base64\r\n`;
    message += `\r\n`;
    
    // Split base64 into 76-char lines
    for (let i = 0; i < rawB64.length; i += 76) {
      message += rawB64.slice(i, i + 76) + "\r\n";
    }
  }

  message += `--${mixedBoundary}--\r\n`;

  // Use Gmail API via SMTP relay - but since Deno doesn't have native SMTP,
  // we'll use the Gmail API REST endpoint instead
  // Encode the full message as base64url for Gmail API
  const rawMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // For now, we'll use nodemailer-like approach via a simple SMTP connection
  // Actually, let's use the Google Gmail API with service account or app password
  // The simplest approach: use Gmail SMTP with Deno's TCP connection
  
  const conn = await Deno.connectTls({
    hostname: "smtp.gmail.com",
    port: 465,
  });

  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  async function readResponse(): Promise<string> {
    const buffer = new Uint8Array(4096);
    const n = await conn.read(buffer);
    if (n === null) return "";
    return textDecoder.decode(buffer.subarray(0, n));
  }

  async function sendCommand(cmd: string): Promise<string> {
    await conn.write(textEncoder.encode(cmd + "\r\n"));
    return await readResponse();
  }

  try {
    // Read greeting
    await readResponse();

    // EHLO
    await sendCommand("EHLO docusend.ca");

    // AUTH LOGIN
    await sendCommand("AUTH LOGIN");
    await sendCommand(btoa(fromEmail));
    const authResult = await sendCommand(btoa(password));
    
    if (!authResult.startsWith("235")) {
      throw new Error("SMTP Authentication failed: " + authResult);
    }

    // MAIL FROM
    await sendCommand(`MAIL FROM:<${fromEmail}>`);

    // RCPT TO
    await sendCommand(`RCPT TO:<${to}>`);

    // DATA
    await sendCommand("DATA");

    // Send message body
    await conn.write(textEncoder.encode(message + "\r\n.\r\n"));
    const dataResult = await readResponse();

    // QUIT
    await sendCommand("QUIT");

    return dataResult;
  } finally {
    conn.close();
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerId,
      customerEmail,
      customerName,
      tenantId,
      tenantName,
      agentId,
      documents, // array of strings: ['invoice', 'loan_agreement']
    } = await req.json();

    if (!customerId || !customerEmail || !documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: customerId, customerEmail, documents" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch email template
    let template = null;
    if (tenantId) {
      const { data } = await supabase
        .from("email_templates")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("template_type", "document_delivery")
        .maybeSingle();
      template = data;
    }
    
    if (!template) {
      // Fallback to default template (no tenant_id)
      const { data } = await supabase
        .from("email_templates")
        .select("*")
        .is("tenant_id", null)
        .eq("template_type", "document_delivery")
        .maybeSingle();
      template = data;
    }

    // Use defaults if no template exists
    const subject = (template?.subject || "Congratulations on Your Home Improvement Purchase - {{tenant_name}}")
      .replace(/\{\{customer_name\}\}/g, customerName || "Valued Customer")
      .replace(/\{\{tenant_name\}\}/g, tenantName || "Our Team");

    const bodyHtml = (template?.body_html || "<p>Dear {{customer_name}},</p><p>Thank you for choosing {{tenant_name}}! Please find your documents attached below.</p><p>If you have any questions, please don't hesitate to reach out.</p><p>Best regards,<br/>{{tenant_name}}</p>")
      .replace(/\{\{customer_name\}\}/g, customerName || "Valued Customer")
      .replace(/\{\{tenant_name\}\}/g, tenantName || "Our Team");

    const fromEmail = template?.from_email || "documents@docusend.ca";
    const fromName = (template?.from_name || "{{tenant_name}}")
      .replace(/\{\{tenant_name\}\}/g, tenantName || "DocuSend");

    // Fetch document PDFs from storage
    const attachments: { filename: string; content: Uint8Array; contentType: string }[] = [];

    // Look up document signatures for this customer to find stored PDFs
    const { data: signatures } = await supabase
      .from("document_signatures")
      .select("*")
      .eq("customer_id", customerId)
      .order("signed_at", { ascending: false });

    for (const docType of documents) {
      // Find the latest signature of this type
      const sig = signatures?.find((s: any) => {
        if (docType === "invoice") return s.document_type === "invoice" || s.document_type === "custom_invoice";
        if (docType === "loan_agreement") return s.document_type === "loan_application" || s.document_type === "loan_agreement";
        return s.document_type === docType;
      });

      if (sig?.document_url) {
        try {
          // Download the PDF
          const pdfResponse = await fetch(sig.document_url);
          if (pdfResponse.ok) {
            const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
            const filename = docType === "invoice" 
              ? `Invoice_${customerName?.replace(/\s+/g, '_') || 'Customer'}.pdf`
              : `Loan_Agreement_${customerName?.replace(/\s+/g, '_') || 'Customer'}.pdf`;
            
            attachments.push({
              filename,
              content: pdfBytes,
              contentType: "application/pdf",
            });
          }
        } catch (e) {
          console.error(`Failed to fetch PDF for ${docType}:`, e);
        }
      }
    }

    // Send the email
    await sendEmailViaSMTP(customerEmail, subject, bodyHtml, fromEmail, fromName, attachments);

    // Record the delivery
    const { error: insertError } = await supabase.from("document_deliveries").insert({
      customer_id: customerId,
      tenant_id: tenantId || null,
      agent_id: agentId,
      recipient_email: customerEmail,
      subject,
      documents_sent: documents,
      status: "sent",
    });

    if (insertError) {
      console.error("Error recording delivery:", insertError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Documents sent successfully", attachmentCount: attachments.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending documents:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send documents" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
