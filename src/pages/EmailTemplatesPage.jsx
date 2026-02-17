import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Mail, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const EmailTemplatesPage = () => {
  const navigate = useNavigate();
  const { tenant, isSuperAdmin, accessibleTenants, isViewingAllTenants } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("default");
  const [allTenants, setAllTenants] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const [template, setTemplate] = useState({
    subject: "Congratulations on Your Home Improvement Purchase - {{tenant_name}}",
    body_html: '<p>Dear {{customer_name}},</p><p>Thank you for choosing {{tenant_name}}! Please find your documents attached below.</p><p>If you have any questions, please don\'t hesitate to reach out.</p><p>Best regards,<br/>{{tenant_name}}</p>',
    from_email: "documents@docusend.ca",
    from_name: "{{tenant_name}}",
  });

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    if (!authenticated) {
      navigate("/");
      return;
    }
    if (!isSuperAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchTenants();
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchTemplate();
  }, [selectedTenantId]);

  const fetchTenants = async () => {
    const { data } = await supabase.from("tenants").select("*").order("name");
    setAllTenants(data || []);
    setLoading(false);
  };

  const fetchTemplate = async () => {
    setLoading(true);
    let query = supabase
      .from("email_templates")
      .select("*")
      .eq("template_type", "document_delivery");

    if (selectedTenantId === "default") {
      query = query.is("tenant_id", null);
    } else {
      query = query.eq("tenant_id", selectedTenantId);
    }

    const { data } = await query.maybeSingle();

    if (data) {
      setTemplate({
        subject: data.subject,
        body_html: data.body_html,
        from_email: data.from_email || "documents@docusend.ca",
        from_name: data.from_name || "{{tenant_name}}",
      });
    } else {
      // Reset to defaults
      setTemplate({
        subject: "Congratulations on Your Home Improvement Purchase - {{tenant_name}}",
        body_html: '<p>Dear {{customer_name}},</p><p>Thank you for choosing {{tenant_name}}! Please find your documents attached below.</p><p>If you have any questions, please don\'t hesitate to reach out.</p><p>Best regards,<br/>{{tenant_name}}</p>',
        from_email: "documents@docusend.ca",
        from_name: "{{tenant_name}}",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tenantId = selectedTenantId === "default" ? null : selectedTenantId;

      // Check if template exists
      let query = supabase
        .from("email_templates")
        .select("id")
        .eq("template_type", "document_delivery");

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      } else {
        query = query.is("tenant_id", null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        await supabase
          .from("email_templates")
          .update({
            subject: template.subject,
            body_html: template.body_html,
            from_email: template.from_email,
            from_name: template.from_name,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("email_templates").insert({
          tenant_id: tenantId,
          template_type: "document_delivery",
          subject: template.subject,
          body_html: template.body_html,
          from_email: template.from_email,
          from_name: template.from_name,
        });
      }

      toast.success("Email template saved successfully");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const previewHtml = template.body_html
    .replace(/\{\{customer_name\}\}/g, "John Smith")
    .replace(/\{\{tenant_name\}\}/g, selectedTenantId === "default" ? "Your Company" : allTenants.find(t => t.id === selectedTenantId)?.name || "Your Company");

  if (loading && allTenants.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Email Templates</h1>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">Super Admin</Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Tenant Selector */}
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Template Scope</CardTitle>
            <CardDescription>Select which tenant this template applies to, or edit the default template.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (All Tenants)</SelectItem>
                {allTenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Template Editor */}
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Document Delivery Email</CardTitle>
            <CardDescription>
              Available variables: <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{"{{customer_name}}"}</code>{" "}
              <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{"{{tenant_name}}"}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  value={template.from_email}
                  onChange={(e) => setTemplate({ ...template, from_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  value={template.from_name}
                  onChange={(e) => setTemplate({ ...template, from_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={template.subject}
                onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Body (HTML)</Label>
              <Textarea
                value={template.body_html}
                onChange={(e) => setTemplate({ ...template, body_html: e.target.value })}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Template
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
                <Eye className="w-4 h-4" />
                {showPreview ? "Hide Preview" : "Preview"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Email Preview</CardTitle>
              <CardDescription>
                Subject: {template.subject.replace(/\{\{customer_name\}\}/g, "John Smith").replace(/\{\{tenant_name\}\}/g, "Sample Company")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-lg p-6 bg-white text-sm"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmailTemplatesPage;
