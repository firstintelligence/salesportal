import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Loader2, Mail, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const DocumentDeliveryModal = ({ open, onOpenChange, customer, onDeliveryComplete }) => {
  const { tenant } = useTenant();
  const [sendInvoice, setSendInvoice] = useState(true);
  const [sendLoanAgreement, setSendLoanAgreement] = useState(true);
  const [sending, setSending] = useState(false);
  const [availableDocs, setAvailableDocs] = useState({ invoice: false, loan_agreement: false });

  useEffect(() => {
    if (open && customer?.id) {
      checkAvailableDocuments();
    }
  }, [open, customer?.id]);

  const checkAvailableDocuments = async () => {
    const { data: signatures } = await supabase
      .from("document_signatures")
      .select("document_type")
      .eq("customer_id", customer.id);

    const hasInvoice = signatures?.some(
      (s) => s.document_type === "invoice" || s.document_type === "custom_invoice"
    );
    const hasLoan = signatures?.some(
      (s) => s.document_type === "loan_application" || s.document_type === "loan_agreement"
    );

    setAvailableDocs({ invoice: !!hasInvoice, loan_agreement: !!hasLoan });
    setSendInvoice(!!hasInvoice);
    setSendLoanAgreement(!!hasLoan);
  };

  const handleSend = async () => {
    const documents = [];
    if (sendInvoice) documents.push("invoice");
    if (sendLoanAgreement) documents.push("loan_agreement");

    if (documents.length === 0) {
      toast.error("Please select at least one document to send");
      return;
    }

    if (!customer.email) {
      toast.error("Customer does not have an email address");
      return;
    }

    setSending(true);
    try {
      const agentId = localStorage.getItem("agentId");
      const customerName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();

      const { data, error } = await supabase.functions.invoke("send-documents", {
        body: {
          customerId: customer.id,
          customerEmail: customer.email,
          customerName,
          tenantId: tenant?.id || null,
          tenantName: tenant?.name || "Our Team",
          agentId,
          documents,
        },
      });

      if (error) throw error;

      toast.success("Documents sent successfully!");
      onDeliveryComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending documents:", error);
      toast.error(error.message || "Failed to send documents");
    } finally {
      setSending(false);
    }
  };

  const noDocsAvailable = !availableDocs.invoice && !availableDocs.loan_agreement;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Send Documents
          </DialogTitle>
          <DialogDescription>
            Send documents to {customer?.first_name} {customer?.last_name} at{" "}
            <span className="font-medium text-foreground">{customer?.email || "no email on file"}</span>
          </DialogDescription>
        </DialogHeader>

        {noDocsAvailable ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No signed documents found for this customer. Please generate and sign an invoice or loan agreement first.
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm font-medium text-foreground">Select documents to send:</p>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                availableDocs.invoice ? "hover:bg-slate-50" : "opacity-50 cursor-not-allowed"
              } ${sendInvoice && availableDocs.invoice ? "border-primary bg-primary/5" : "border-slate-200"}`}>
                <Checkbox
                  checked={sendInvoice}
                  onCheckedChange={(checked) => setSendInvoice(!!checked)}
                  disabled={!availableDocs.invoice}
                />
                <div>
                  <p className="text-sm font-medium">Invoice</p>
                  <p className="text-xs text-muted-foreground">
                    {availableDocs.invoice ? "Ready to send" : "Not yet generated"}
                  </p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                availableDocs.loan_agreement ? "hover:bg-slate-50" : "opacity-50 cursor-not-allowed"
              } ${sendLoanAgreement && availableDocs.loan_agreement ? "border-primary bg-primary/5" : "border-slate-200"}`}>
                <Checkbox
                  checked={sendLoanAgreement}
                  onCheckedChange={(checked) => setSendLoanAgreement(!!checked)}
                  disabled={!availableDocs.loan_agreement}
                />
                <div>
                  <p className="text-sm font-medium">Loan Agreement</p>
                  <p className="text-xs text-muted-foreground">
                    {availableDocs.loan_agreement ? "Ready to send" : "Not yet generated"}
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || noDocsAvailable || (!sendInvoice && !sendLoanAgreement) || !customer?.email}
            className="gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Documents
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentDeliveryModal;
