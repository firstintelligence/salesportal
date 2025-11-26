import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Upload,
  X,
  CheckCircle,
  Loader2,
  MapPin,
  Package,
  Image,
  ChevronRight,
  FileText,
  CreditCard,
} from "lucide-react";

// Define checklist items for each category
const CHECKLIST_CATEGORIES = {
  "Job Site Pictures": {
    icon: Camera,
    gradient: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    items: [
      "Front of House",
      "Installation Area",
      "Equipment Installed",
      "Work Completed",
    ],
  },
  "Void Cheque": {
    icon: FileText,
    gradient: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    items: [
      "Void Cheque",
    ],
  },
  "Photo ID": {
    icon: CreditCard,
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    items: [
      "Photo ID (Front)",
      "Photo ID (Back)",
    ],
  },
};

// All customers get all categories
const getDefaultCategories = () => Object.keys(CHECKLIST_CATEGORIES);

// Circular Progress Component
const CircularProgress = ({ value, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-emerald-500 transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(value)}%</span>
      </div>
    </div>
  );
};

const InstallationChecklist = ({ customer, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [photos, setPhotos] = useState({});
  const [uploading, setUploading] = useState({});
  const [checklistId, setChecklistId] = useState(null);
  const [checklistStatus, setChecklistStatus] = useState("pending");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef({});
  const agentId = localStorage.getItem("agentId");

  // All customers get all categories
  const applicableCategories = getDefaultCategories();

  useEffect(() => {
    loadExistingChecklist();
  }, [customer.id]);

  const loadExistingChecklist = async () => {
    try {
      const { data: existingChecklist } = await supabase
        .from("installation_checklists")
        .select("*")
        .eq("tpv_request_id", customer.id)
        .maybeSingle();

      if (existingChecklist) {
        setChecklistId(existingChecklist.id);
        setChecklistStatus(existingChecklist.status);

        const { data: existingPhotos } = await supabase
          .from("checklist_photos")
          .select("*")
          .eq("checklist_id", existingChecklist.id);

        if (existingPhotos) {
          const photoMap = {};
          existingPhotos.forEach((photo) => {
            if (!photoMap[photo.category]) {
              photoMap[photo.category] = {};
            }
            photoMap[photo.category][photo.item_name] = photo.photo_url;
          });
          setPhotos(photoMap);
        }
      }
    } catch (error) {
      console.log("No existing checklist found");
    }
  };

  const handleFileUpload = async (category, itemName, file) => {
    if (!file) return;

    const uploadKey = `${category}-${itemName}`;
    setUploading((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      let currentChecklistId = checklistId;
      if (!currentChecklistId) {
        const { data: newChecklist, error: createError } = await supabase
          .from("installation_checklists")
          .insert({
            tpv_request_id: customer.id,
            agent_id: agentId,
            status: "pending",
          })
          .select()
          .single();

        if (createError) throw createError;
        currentChecklistId = newChecklist.id;
        setChecklistId(currentChecklistId);
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${currentChecklistId}/${category}/${itemName.replace(/\s+/g, "_")}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("checklist-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("checklist-photos")
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      await supabase
        .from("checklist_photos")
        .delete()
        .eq("checklist_id", currentChecklistId)
        .eq("category", category)
        .eq("item_name", itemName);

      const { error: insertError } = await supabase
        .from("checklist_photos")
        .insert({
          checklist_id: currentChecklistId,
          category,
          item_name: itemName,
          photo_url: photoUrl,
        });

      if (insertError) throw insertError;

      setPhotos((prev) => ({
        ...prev,
        [category]: {
          ...(prev[category] || {}),
          [itemName]: photoUrl,
        },
      }));

      toast.success(`Photo uploaded for ${itemName}`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleRemovePhoto = async (category, itemName) => {
    try {
      if (checklistId) {
        await supabase
          .from("checklist_photos")
          .delete()
          .eq("checklist_id", checklistId)
          .eq("category", category)
          .eq("item_name", itemName);
      }

      setPhotos((prev) => {
        const updated = { ...prev };
        if (updated[category]) {
          delete updated[category][itemName];
        }
        return updated;
      });

      toast.success("Photo removed");
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove photo");
    }
  };

  const handleCameraCapture = (category, itemName) => {
    const inputKey = `${category}-${itemName}`;
    if (fileInputRefs.current[inputKey]) {
      fileInputRefs.current[inputKey].click();
    }
  };

  const getCategoryProgress = (category) => {
    const items = CHECKLIST_CATEGORIES[category].items;
    const uploadedCount = items.filter((item) => photos[category]?.[item]).length;
    return { uploaded: uploadedCount, total: items.length };
  };

  const getTotalProgress = () => {
    let totalItems = 0;
    let totalUploaded = 0;

    applicableCategories.forEach((category) => {
      const { uploaded, total } = getCategoryProgress(category);
      totalItems += total;
      totalUploaded += uploaded;
    });

    return { uploaded: totalUploaded, total: totalItems };
  };

  const handleSubmitChecklist = async () => {
    const { uploaded, total } = getTotalProgress();

    if (uploaded < total) {
      toast.error(`Please complete all ${total - uploaded} remaining photos before submitting`);
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("installation_checklists")
        .update({
          status: "completed",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", checklistId);

      if (error) throw error;

      setChecklistStatus("completed");
      toast.success("Checklist submitted successfully!");
      onBack();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit checklist");
    } finally {
      setSubmitting(false);
    }
  };

  // Category detail view
  if (selectedCategory) {
    const CategoryIcon = CHECKLIST_CATEGORIES[selectedCategory].icon;
    const categoryData = CHECKLIST_CATEGORIES[selectedCategory];
    const items = categoryData.items;
    const { uploaded, total } = getCategoryProgress(selectedCategory);
    const progressPercent = (uploaded / total) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className={`bg-gradient-to-r ${categoryData.gradient} p-6 pb-12`}>
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedCategory(null)}
              className="text-white/90 hover:text-white hover:bg-white/20 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <CategoryIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedCategory}</h2>
                <p className="text-white/80 text-sm">{uploaded} of {total} photos completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto px-4 -mt-6">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Progress</span>
                <span className="text-sm font-bold text-foreground">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Photo Items */}
        <div className="max-w-2xl mx-auto p-4 space-y-3 mt-4">
          {items.map((item, index) => {
            const uploadKey = `${selectedCategory}-${item}`;
            const isUploading = uploading[uploadKey];
            const photoUrl = photos[selectedCategory]?.[item];

            return (
              <Card 
                key={item} 
                className={`overflow-hidden transition-all duration-300 ${
                  photoUrl ? `${categoryData.bgLight} ${categoryData.borderColor} border-2` : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-0">
                  {photoUrl ? (
                    <div className="relative">
                      <img
                        src={photoUrl}
                        alt={item}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span className="font-medium text-white">{item}</span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="shadow-lg"
                          onClick={() => handleRemovePhoto(selectedCategory, item)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <Image className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{item}</span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground">Required</Badge>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        ref={(el) => (fileInputRefs.current[uploadKey] = el)}
                        onChange={(e) =>
                          handleFileUpload(selectedCategory, item, e.target.files?.[0])
                        }
                      />

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-12"
                          onClick={() => handleCameraCapture(selectedCategory, item)}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Camera className="w-5 h-5 mr-2" />
                              Take Photo
                            </>
                          )}
                        </Button>
                        <label className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(selectedCategory, item, e.target.files?.[0])
                            }
                          />
                          <Button
                            variant="secondary"
                            className="w-full h-12"
                            asChild
                            disabled={isUploading}
                          >
                            <span>
                              {isUploading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 mr-2" />
                                  Upload
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Main category selection view
  const { uploaded: totalUploaded, total: totalItems } = getTotalProgress();
  const overallProgress = totalItems > 0 ? (totalUploaded / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-2xl font-bold text-primary-foreground mb-1">
            Installation Checklist
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            Document the installation with photos
          </p>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="max-w-2xl mx-auto px-4 -mt-12">
        <Card className="shadow-xl">
          <CardContent className="p-5">
            <div className="flex gap-4">
              {/* Progress Circle */}
              <div className="flex-shrink-0">
                <CircularProgress value={overallProgress} size={100} strokeWidth={6} />
              </div>

              {/* Customer Details */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">
                  {customer.first_name} {customer.last_name}
                </h2>
                <div className="flex items-start gap-2 mt-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{customer.customer_address}, {customer.city}</span>
                </div>
                <div className="flex items-start gap-2 mt-1 text-sm text-muted-foreground">
                  <Package className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{customer.products || "No products"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalUploaded} of {totalItems} photos completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <div className="max-w-2xl mx-auto p-4 mt-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Installation Categories
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {applicableCategories.map((category, index) => {
            const CategoryIcon = CHECKLIST_CATEGORIES[category].icon;
            const categoryData = CHECKLIST_CATEGORIES[category];
            const { uploaded, total } = getCategoryProgress(category);
            const isComplete = uploaded === total;
            const progressPercent = (uploaded / total) * 100;

            return (
              <Card
                key={category}
                className={`cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                  isComplete ? "ring-2 ring-emerald-500 ring-offset-2" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-0">
                  {/* Gradient Header */}
                  <div className={`bg-gradient-to-r ${categoryData.gradient} p-4 flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{category}</h3>
                      <p className="text-white/80 text-xs">{uploaded}/{total} photos</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/60" />
                  </div>

                  {/* Progress */}
                  <div className="p-3">
                    <Progress value={progressPercent} className="h-1.5" />
                    {isComplete && (
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Complete</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Submit Section */}
      <div className="max-w-2xl mx-auto p-4 pb-8">
        {checklistStatus !== "completed" ? (
          <Button
            className="w-full h-14 text-lg font-semibold shadow-lg"
            variant={totalUploaded >= totalItems ? "default" : "secondary"}
            size="lg"
            onClick={handleSubmitChecklist}
            disabled={submitting || totalUploaded < totalItems}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                {totalUploaded >= totalItems 
                  ? "Submit Checklist" 
                  : `${totalItems - totalUploaded} photos remaining`
                }
              </>
            )}
          </Button>
        ) : (
          <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                Checklist Completed
              </h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                This installation has been verified and submitted
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InstallationChecklist;
