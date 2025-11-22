import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const TPVRequest = ({ onBack }) => {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    paymentAmount: "",
    paymentMethod: "",
    notes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.customerName || !formData.customerPhone || !formData.paymentAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Here you would typically submit to a backend
    console.log("TPV Request submitted:", formData);
    toast.success("TPV request submitted successfully");
    
    // Reset form
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      paymentAmount: "",
      paymentMethod: "",
      notes: "",
    });
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to TPV System
        </Button>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Create TPV Request
        </h1>
        <p className="text-muted-foreground mb-8">
          Submit a third-party verification request for payment details
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customerName">
              Customer Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={handleChange("customerName")}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">
              Customer Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={handleChange("customerPhone")}
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Customer Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={handleChange("customerEmail")}
              placeholder="customer@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentAmount">
              Payment Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="paymentAmount"
              type="number"
              step="0.01"
              value={formData.paymentAmount}
              onChange={handleChange("paymentAmount")}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Input
              id="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange("paymentMethod")}
              placeholder="Credit Card, Check, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleChange("notes")}
              placeholder="Any additional information..."
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" size="lg" className="flex-1">
              Submit TPV Request
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onBack}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TPVRequest;
