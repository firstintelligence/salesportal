import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PenLine, Loader2, FileCheck } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import FloatingLabelInput from "@/components/FloatingLabelInput";
import FullscreenSignaturePad from "@/components/FullscreenSignaturePad";

const AGREEMENT_URL = "/templates/HRSP-Heat-Pump-Participant-Agreement.pdf";

// Page 6 of the agreement holds the participant fields.
// Legal name + email are fillable form fields; signature + date are signature
// widgets, so their values are drawn at the widget rectangles.
const PAGE_INDEX = 5;
const SIGNATURE_RECT = { x: 146.28, y: 170.64, width: 335.4, height: 28.8 };
const DATE_POS = { x: 118, y: 140 };


const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const RebatesPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    legalName: "",
    email: "",
    signatureDate: todayISO(),
  });
  const [signature, setSignature] = useState(null);
  const [showPad, setShowPad] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) navigate("/");
  }, [navigate]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSignAndFinish = async () => {
    if (!form.legalName.trim()) {
      toast({ title: "Participant legal name is required", variant: "destructive" });
      return;
    }
    if (!signature) {
      toast({ title: "Please add the participant signature", variant: "destructive" });
      return;
    }
    if (!form.email.trim()) {
      toast({ title: "Participant email address is required", variant: "destructive" });
      return;
    }
    if (!form.signatureDate) {
      toast({ title: "Signature date is required", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const bytes = await fetch(AGREEMENT_URL).then((r) => {
        if (!r.ok) throw new Error("Agreement template not found");
        return r.arrayBuffer();
      });
      const pdfDoc = await PDFDocument.load(bytes);
      const page = pdfDoc.getPages()[PAGE_INDEX];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Fill the two text form fields
      const pdfForm = pdfDoc.getForm();
      const setText = (name, value) => {
        try {
          const field = pdfForm.getTextField(name);
          field.setFontSize(11);
          field.setText(value);
          field.enableReadOnly();
        } catch (e) {
          console.warn(`Field "${name}" not fillable, drawing instead`, e);
        }
      };
      setText("Participant Legal Name", form.legalName.trim());
      setText("Participant Email Address", form.email.trim());
      pdfForm.updateFieldAppearances(font);

      // Signature date sits in a signature widget - draw it directly
      page.drawText(formatDate(form.signatureDate), {
        x: DATE_POS.x,
        y: DATE_POS.y,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });

      const pngImage = await pdfDoc.embedPng(signature);
      const scale = Math.min(
        200 / pngImage.width,
        SIGNATURE_RECT.height / pngImage.height
      );
      page.drawImage(pngImage, {
        x: SIGNATURE_RECT.x + 4,
        y: SIGNATURE_RECT.y + 2,
        width: pngImage.width * scale,
        height: pngImage.height * scale,
      });


      const saved = await pdfDoc.save();
      const blob = new Blob([saved], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = form.legalName.trim().replace(/[^a-z0-9]+/gi, "-");
      link.href = url;
      link.download = `HRSP-Participant-Agreement-${safeName}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      toast({ title: "Signed agreement generated" });
    } catch (err) {
      console.error("Error generating agreement:", err);
      toast({
        title: "Could not generate the agreement",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-9 px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm sm:text-lg font-bold text-slate-800">Rebates</h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 py-5 sm:px-6 sm:py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">
              HRSP Heat Pump Participant Agreement
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Fill in the participant details, then sign and finish to get the completed agreement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FloatingLabelInput
              id="legalName"
              name="legalName"
              label="Participant Legal Name"
              value={form.legalName}
              onChange={handleChange}
            />

            <div>
              <button
                type="button"
                onClick={() => setShowPad(true)}
                className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-left hover:border-blue-500 transition-colors"
              >
                {signature ? (
                  <div className="flex items-center justify-between gap-3">
                    <img src={signature} alt="Participant signature" className="h-12 object-contain" />
                    <span className="text-xs text-blue-600 font-medium">Change</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <PenLine className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Tap to add Participant Signature</span>
                  </div>
                )}
              </button>
            </div>

            <FloatingLabelInput
              id="signatureDate"
              name="signatureDate"
              label="Signature Date"
              type="date"
              value={form.signatureDate}
              onChange={handleChange}
            />

            <FloatingLabelInput
              id="email"
              name="email"
              label="Participant Email Address"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoCapitalize={false}
            />
          </div>

          <Button
            onClick={handleSignAndFinish}
            disabled={isGenerating}
            className="w-full mt-6 h-11 font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4 mr-2" />
                Sign and Finish
              </>
            )}
          </Button>
        </div>
      </div>

      <FullscreenSignaturePad
        isOpen={showPad}
        onClose={() => setShowPad(false)}
        initialSignature={signature}
        onSave={(dataUrl) => {
          setSignature(dataUrl);
          setShowPad(false);
        }}
      />
    </div>
  );
};

export default RebatesPage;
