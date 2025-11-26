import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Upload,
  X,
  CheckCircle,
  Loader2,
  Thermometer,
  Wind,
  Droplets,
  Filter,
  Sun,
  Battery,
} from "lucide-react";

// Define checklist items for each category
const CHECKLIST_CATEGORIES = {
  HVAC: {
    icon: Thermometer,
    color: "bg-red-500",
    items: [
      "Indoor Unit",
      "Outdoor Unit",
      "Venting",
      "Electrical Panel",
      "Ductwork",
      "Thermostat",
      "Gas Line Connection",
      "Condensate Drain",
    ],
  },
  "Air Filters": {
    icon: Wind,
    color: "bg-blue-500",
    items: [
      "Filter Unit",
      "Filter Media",
      "Installation Location",
      "Ductwork Connection",
      "Control Panel",
    ],
  },
  "Water Heater": {
    icon: Droplets,
    color: "bg-cyan-500",
    items: [
      "Water Heater Unit",
      "Venting System",
      "Gas/Electrical Connection",
      "Water Connections",
      "Expansion Tank",
      "Pressure Relief Valve",
      "Installation Area",
    ],
  },
  "Water Filters": {
    icon: Filter,
    color: "bg-teal-500",
    items: [
      "Filter System",
      "Water Line Connections",
      "Bypass Valve",
      "Drain Connection",
      "Control Head",
      "Installation Location",
    ],
  },
  Solar: {
    icon: Sun,
    color: "bg-yellow-500",
    items: [
      "Solar Panels",
      "Roof Mounting",
      "Inverter",
      "Electrical Panel Connection",
      "Wiring/Conduit",
      "Monitoring System",
      "Meter Connection",
    ],
  },
  Battery: {
    icon: Battery,
    color: "bg-green-500",
    items: [
      "Battery Unit",
      "Mounting Location",
      "Electrical Connections",
      "Inverter Connection",
      "Ventilation",
      "Control Panel",
    ],
  },
};

// Map product names to categories
const PRODUCT_CATEGORY_MAP = {
  "Furnace": "HVAC",
  "Air Conditioner": "HVAC",
  "Heat Pump": "HVAC",
  "HVAC": "HVAC",
  "Air Filter": "Air Filters",
  "Air Purifier": "Air Filters",
  "Water Heater": "Water Heater",
  "Tankless Water Heater": "Water Heater",
  "Water Filter": "Water Filters",
  "Water Softener": "Water Filters",
  "Reverse Osmosis": "Water Filters",
  "Solar": "Solar",
  "Solar Panels": "Solar",
  "Battery": "Battery",
  "Battery Storage": "Battery",
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

  // Determine which categories apply based on products
  const getApplicableCategories = () => {
    const products = customer.products?.split(",").map((p) => p.trim()) || [];
    const categories = new Set();

    products.forEach((product) => {
      // Check direct mapping
      Object.entries(PRODUCT_CATEGORY_MAP).forEach(([key, category]) => {
        if (product.toLowerCase().includes(key.toLowerCase())) {
          categories.add(category);
        }
      });
    });

    // If no specific matches, show all categories
    if (categories.size === 0) {
      return Object.keys(CHECKLIST_CATEGORIES);
    }

    return Array.from(categories);
  };

  const applicableCategories = getApplicableCategories();

  useEffect(() => {
    loadExistingChecklist();
  }, [customer.id]);

  const loadExistingChecklist = async () => {
    try {
      // Check for existing checklist
      const { data: existingChecklist, error: checklistError } = await supabase
        .from("installation_checklists")
        .select("*")
        .eq("tpv_request_id", customer.id)
        .single();

      if (existingChecklist) {
        setChecklistId(existingChecklist.id);
        setChecklistStatus(existingChecklist.status);

        // Load existing photos
        const { data: existingPhotos, error: photosError } = await supabase
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
      // No existing checklist, that's fine
      console.log("No existing checklist found");
    }
  };

  const handleFileUpload = async (category, itemName, file) => {
    if (!file) return;

    const uploadKey = `${category}-${itemName}`;
    setUploading((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      // Create checklist if not exists
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

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentChecklistId}/${category}/${itemName.replace(/\s+/g, "_")}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("checklist-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("checklist-photos")
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      // Delete existing photo record if exists
      await supabase
        .from("checklist_photos")
        .delete()
        .eq("checklist_id", currentChecklistId)
        .eq("category", category)
        .eq("item_name", itemName);

      // Save photo record
      const { error: insertError } = await supabase
        .from("checklist_photos")
        .insert({
          checklist_id: currentChecklistId,
          category,
          item_name: itemName,
          photo_url: photoUrl,
        });

      if (insertError) throw insertError;

      // Update local state
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

  if (selectedCategory) {
    const CategoryIcon = CHECKLIST_CATEGORIES[selectedCategory].icon;
    const items = CHECKLIST_CATEGORIES[selectedCategory].items;
    const { uploaded, total } = getCategoryProgress(selectedCategory);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => setSelectedCategory(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CategoryIcon className="w-5 h-5" />
                {selectedCategory}
              </h2>
              <p className="text-sm text-muted-foreground">
                {uploaded}/{total} photos uploaded
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item) => {
              const uploadKey = `${selectedCategory}-${item}`;
              const isUploading = uploading[uploadKey];
              const photoUrl = photos[selectedCategory]?.[item];

              return (
                <Card key={item}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-foreground">{item}</span>
                      {photoUrl && (
                        <Badge className="bg-emerald-500">
                          <CheckCircle className="w-3 h-3 mr-1" /> Uploaded
                        </Badge>
                      )}
                    </div>

                    {photoUrl ? (
                      <div className="relative">
                        <img
                          src={photoUrl}
                          alt={item}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemovePhoto(selectedCategory, item)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
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
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleCameraCapture(selectedCategory, item)}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4 mr-2" />
                          )}
                          Camera
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
                            variant="outline"
                            className="w-full"
                            asChild
                            disabled={isUploading}
                          >
                            <span>
                              {isUploading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Upload
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const { uploaded: totalUploaded, total: totalItems } = getTotalProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {customer.customer_address}, {customer.city}
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="font-medium text-foreground">{customer.products || "Not specified"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="font-medium text-foreground">
                  {totalUploaded}/{totalItems} photos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-4 text-foreground">Installation Categories</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {applicableCategories.map((category) => {
            const CategoryIcon = CHECKLIST_CATEGORIES[category].icon;
            const { uploaded, total } = getCategoryProgress(category);
            const isComplete = uploaded === total;

            return (
              <Card
                key={category}
                className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                  isComplete ? "ring-2 ring-emerald-500" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                <CardContent className="p-4 text-center">
                  <div
                    className={`w-12 h-12 rounded-full ${CHECKLIST_CATEGORIES[category].color} flex items-center justify-center mx-auto mb-3`}
                  >
                    <CategoryIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground">{category}</h3>
                  <p className="text-sm text-muted-foreground">
                    {uploaded}/{total} photos
                  </p>
                  {isComplete && (
                    <Badge className="mt-2 bg-emerald-500">
                      <CheckCircle className="w-3 h-3 mr-1" /> Complete
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {checklistStatus !== "completed" && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmitChecklist}
            disabled={submitting || totalUploaded < totalItems}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Checklist ({totalUploaded}/{totalItems})
              </>
            )}
          </Button>
        )}

        {checklistStatus === "completed" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-emerald-600">Checklist Completed</p>
            <p className="text-sm text-muted-foreground">
              This installation checklist has been submitted
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallationChecklist;
