import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy, CheckCircle, User, MapPin, Phone, Mail, Package,
  ClipboardList, Camera, ArrowLeft, ExternalLink, Send, Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPhoneNumber } from "@/utils/phoneFormat";

const DispatchView = ({ customer, checklistId, onBack }) => {
  const [checklist, setChecklist] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [questionnaire, setQuestionnaire] = useState({});
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDispatchData();
  }, [checklistId]);

  const loadDispatchData = async () => {
    try {
      // Load checklist
      const { data: checklistData } = await supabase
        .from("installation_checklists")
        .select("*")
        .eq("id", checklistId)
        .single();
      
      setChecklist(checklistData);
      if (checklistData?.questionnaire_data) {
        setQuestionnaire(checklistData.questionnaire_data);
      }

      // Load photos
      const { data: photoData } = await supabase
        .from("checklist_photos")
        .select("*")
        .eq("checklist_id", checklistId)
        .order("category");
      
      setPhotos(photoData || []);

      // Load technicians
      const { data: techData } = await supabase
        .from("technicians")
        .select("*")
        .eq("active", true)
        .order("name");
      
      setTechnicians(techData || []);
    } catch (error) {
      console.error("Error loading dispatch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildSummaryText = () => {
    const lines = [];
    lines.push("=== JOB DISPATCH SUMMARY ===");
    lines.push("");
    lines.push(`Customer: ${customer.first_name} ${customer.last_name}`);
    lines.push(`Phone: ${formatPhoneNumber(customer.phone)}`);
    if (customer.email) lines.push(`Email: ${customer.email}`);
    lines.push(`Address: ${customer.address}, ${customer.city}, ${customer.province} ${customer.postal_code || ''}`);
    
    if (customer.products) {
      lines.push(`Products: ${customer.products}`);
    }

    // Questionnaire answers
    if (Object.keys(questionnaire).length > 0) {
      lines.push("");
      lines.push("--- SITE ASSESSMENT ---");
      Object.entries(questionnaire).forEach(([key, value]) => {
        // Make the key readable
        const label = key.replace(/_/g, ' ').replace(/^[^_]+\s/, '').replace(/\b\w/g, l => l.toUpperCase());
        lines.push(`${label}: ${value}`);
      });
    }

    // Photo URLs
    if (photos.length > 0) {
      lines.push("");
      lines.push("--- PHOTOS ---");
      const grouped = {};
      photos.forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
      });
      Object.entries(grouped).forEach(([category, categoryPhotos]) => {
        lines.push(`[${category}]`);
        categoryPhotos.forEach(p => {
          lines.push(`  ${p.item_name}: ${p.photo_url}`);
        });
      });
    }

    if (selectedTechnician) {
      const tech = technicians.find(t => t.id === selectedTechnician);
      if (tech) {
        lines.push("");
        lines.push(`Dispatched to: ${tech.name}${tech.phone ? ` (${tech.phone})` : ''}`);
      }
    }

    lines.push("");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    
    return lines.join("\n");
  };

  const handleCopyAll = () => {
    const text = buildSummaryText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Job summary copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group photos by category
  const groupedPhotos = {};
  photos.forEach(p => {
    if (!groupedPhotos[p.category]) groupedPhotos[p.category] = [];
    groupedPhotos[p.category].push(p);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Dispatch Job
        </h3>
      </div>

      {/* Customer Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="font-semibold">{customer.first_name} {customer.last_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-3.5 h-3.5" />
            <span>{formatPhoneNumber(customer.phone)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{customer.address}, {customer.city}, {customer.province}</span>
          </div>
          {customer.products && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="w-3.5 h-3.5" />
              <span>{customer.products}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questionnaire Answers */}
      {Object.keys(questionnaire).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-500" />
              Site Assessment
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(questionnaire).map(([key, value]) => {
                const label = key.replace(/_/g, ' ').replace(/^[^_]+\s/, '').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <div key={key} className="text-sm">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Grid */}
      {Object.keys(groupedPhotos).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" />
              Photos ({photos.length})
            </h4>
            {Object.entries(groupedPhotos).map(([category, categoryPhotos]) => (
              <div key={category} className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                <div className="grid grid-cols-3 gap-2">
                  {categoryPhotos.map((photo) => (
                    <a key={photo.id} href={photo.photo_url} target="_blank" rel="noopener noreferrer" className="relative group">
                      <img src={photo.photo_url} alt={photo.item_name} className="w-full h-20 object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{photo.item_name}</p>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Select Technician */}
      {technicians.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">Assign Technician</h4>
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select technician..." />
              </SelectTrigger>
              <SelectContent>
                {technicians.map(tech => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}{tech.specialty ? ` (${tech.specialty})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Copy All Button */}
      <Button
        className="w-full h-14 text-lg font-semibold shadow-lg"
        onClick={handleCopyAll}
      >
        {copied ? (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-5 h-5 mr-2" />
            Copy Job Summary
          </>
        )}
      </Button>
    </div>
  );
};

export default DispatchView;
