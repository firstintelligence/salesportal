import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User, MapPin, Phone, Package, Camera, Upload, CheckCircle,
  Loader2, ArrowLeft, Image, FileText, Trash2, LogOut, X
} from "lucide-react";
import { formatPhoneNumber } from "@/utils/phoneFormat";

const ContractorPortalPage = () => {
  const navigate = useNavigate();
  const { agentProfile, clearTenantData } = useTenant();
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [preInstallPhotos, setPreInstallPhotos] = useState([]);
  const fileInputRef = useRef(null);
  const agentId = localStorage.getItem("agentId");

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
      return;
    }
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    try {
      const { data, error } = await supabase
        .from("job_dispatches")
        .select("*, customers(*)")
        .eq("contractor_agent_id", agentId)
        .order("dispatched_at", { ascending: false });

      if (error) throw error;
      setDispatches(data || []);
    } catch (error) {
      console.error("Error fetching dispatches:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const loadDispatchPhotos = async (dispatch) => {
    setSelectedDispatch(dispatch);
    
    // Load completion photos
    const { data: completionPhotos } = await supabase
      .from("dispatch_photos")
      .select("*")
      .eq("dispatch_id", dispatch.id)
      .eq("photo_type", "completion")
      .order("created_at");
    setPhotos(completionPhotos || []);

    // Load pre-install photos from checklist
    const { data: checklistPhotos } = await supabase
      .from("checklist_photos")
      .select("*, installation_checklists!inner(customer_id)")
      .eq("installation_checklists.customer_id", dispatch.customer_id);
    setPreInstallPhotos(checklistPhotos || []);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedDispatch) return;

    setUploading(true);
    const customer = selectedDispatch.customers;
    const customerLabel = `${customer.first_name} ${customer.last_name}, ${customer.address}, ${customer.city}, ${customer.province}`;

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedDispatch.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("checklist-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("checklist-photos")
          .getPublicUrl(fileName);

        // Call AI to label the photo
        let aiLabel = file.name;
        try {
          const reader = new FileReader();
          const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
          });

          const { data: labelData, error: labelError } = await supabase.functions.invoke("label-photo", {
            body: { imageBase64: base64, customerLabel }
          });

          if (!labelError && labelData?.label) {
            aiLabel = labelData.label;
          }
        } catch (labelErr) {
          console.warn("AI labeling failed, using filename:", labelErr);
        }

        // Insert photo record
        const { data: photoRecord, error: insertError } = await supabase
          .from("dispatch_photos")
          .insert({
            dispatch_id: selectedDispatch.id,
            customer_id: selectedDispatch.customer_id,
            uploaded_by: agentId,
            photo_url: urlData.publicUrl,
            ai_label: aiLabel,
            photo_type: "completion",
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPhotos(prev => [...prev, photoRecord]);
      }

      toast.success(`${files.length} photo(s) uploaded`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoId) => {
    const { error } = await supabase
      .from("dispatch_photos")
      .delete()
      .eq("id", photoId);

    if (!error) {
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success("Photo deleted");
    }
  };

  const handleCompleteJob = async () => {
    if (!selectedDispatch) return;
    setCompleting(true);

    try {
      const { error } = await supabase
        .from("job_dispatches")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", selectedDispatch.id);

      if (error) throw error;

      toast.success("Job marked as completed!");
      setSelectedDispatch(null);
      fetchDispatches();
    } catch (error) {
      console.error("Error completing job:", error);
      toast.error("Failed to complete job");
    } finally {
      setCompleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authenticated");
    localStorage.removeItem("agentId");
    clearTenantData();
    navigate("/");
  };

  const getStatusBadge = (status) => {
    const config = {
      dispatched: { label: "Assigned", className: "bg-blue-100 text-blue-800" },
      in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    };
    const c = config[status] || config.dispatched;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Detail view for a selected dispatch
  if (selectedDispatch) {
    const customer = selectedDispatch.customers;
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDispatch(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="font-semibold text-sm truncate">
              {customer.first_name} {customer.last_name}
            </h1>
            {getStatusBadge(selectedDispatch.status)}
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
          {/* Customer Info */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-semibold">{customer.first_name} {customer.last_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <a href={`tel:${customer.phone}`}>{formatPhoneNumber(customer.phone)}</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{customer.address}, {customer.city}, {customer.province} {customer.postal_code || ""}</span>
              </div>
              {selectedDispatch.products && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="w-3.5 h-3.5" />
                  <span>{selectedDispatch.products}</span>
                </div>
              )}
              {selectedDispatch.notes && (
                <div className="mt-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                  <strong>Notes:</strong> {selectedDispatch.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pre-Install Photos (from agent checklist) */}
          {preInstallPhotos.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4 text-blue-500" />
                  Pre-Install Photos ({preInstallPhotos.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {preInstallPhotos.map(photo => (
                    <div key={photo.id} className="space-y-1">
                      <a href={photo.photo_url} target="_blank" rel="noopener noreferrer">
                        <img src={photo.photo_url} alt={photo.item_name} className="w-full h-24 object-cover rounded-lg" />
                      </a>
                      <p className="text-[10px] text-muted-foreground truncate">{photo.category} - {photo.item_name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion Photos */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-green-500" />
                Completion Photos ({photos.length})
              </h3>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <a href={photo.photo_url} target="_blank" rel="noopener noreferrer">
                        <img src={photo.photo_url} alt={photo.ai_label || ""} className="w-full h-32 object-cover rounded-lg" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{photo.ai_label}</p>
                      {selectedDispatch.status !== "completed" && (
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedDispatch.status !== "completed" && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Upload Photos</>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Complete Job Button */}
          {selectedDispatch.status !== "completed" && photos.length > 0 && (
            <Button
              className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
              onClick={handleCompleteJob}
              disabled={completing}
            >
              {completing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Completing...</>
              ) : (
                <><CheckCircle className="w-5 h-5 mr-2" /> Mark Job Complete</>
              )}
            </Button>
          )}

          {selectedDispatch.status === "completed" && (
            <div className="text-center py-4">
              <Badge className="bg-green-100 text-green-800 text-base px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2 inline" /> Job Completed
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Job list view
  const activeJobs = dispatches.filter(d => d.status !== "completed");
  const completedJobs = dispatches.filter(d => d.status === "completed");

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">
            Contractor Portal
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {agentProfile?.first_name} {agentProfile?.last_name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          Active Jobs ({activeJobs.length})
        </h2>

        {activeJobs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No active jobs assigned to you.
            </CardContent>
          </Card>
        )}

        {activeJobs.map(dispatch => (
          <Card
            key={dispatch.id}
            className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
            onClick={() => loadDispatchPhotos(dispatch)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">
                    {dispatch.customers?.first_name} {dispatch.customers?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dispatch.customers?.address}, {dispatch.customers?.city}
                  </p>
                </div>
                {getStatusBadge(dispatch.status)}
              </div>
              {dispatch.products && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Package className="w-3 h-3" />
                  <span>{dispatch.products}</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                Dispatched: {new Date(dispatch.dispatched_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}

        {completedJobs.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mt-6">
              Completed ({completedJobs.length})
            </h2>
            {completedJobs.map(dispatch => (
              <Card
                key={dispatch.id}
                className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                onClick={() => loadDispatchPhotos(dispatch)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {dispatch.customers?.first_name} {dispatch.customers?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dispatch.customers?.address}, {dispatch.customers?.city}
                      </p>
                    </div>
                    {getStatusBadge(dispatch.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ContractorPortalPage;
