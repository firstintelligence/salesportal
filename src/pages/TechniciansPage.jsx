import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Edit2, Save, X, Users, Phone, Mail, Wrench, Loader2,
} from "lucide-react";
import FloatingLabelInput from "@/components/FloatingLabelInput";
import { useTenant } from "@/contexts/TenantContext";

const TechniciansPage = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", specialty: "" });

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
      return;
    }
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from("technicians")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error("Error fetching technicians:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const { error } = await supabase.from("technicians").insert({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        specialty: formData.specialty || null,
        tenant_id: tenant?.id || null,
      });
      if (error) throw error;
      toast.success("Technician added");
      setFormData({ name: "", email: "", phone: "", specialty: "" });
      setShowAddForm(false);
      fetchTechnicians();
    } catch (error) {
      console.error("Error adding technician:", error);
      toast.error("Failed to add technician");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const { error } = await supabase.from("technicians").update({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        specialty: formData.specialty || null,
      }).eq("id", id);
      if (error) throw error;
      toast.success("Technician updated");
      setEditingId(null);
      fetchTechnicians();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from("technicians").update({ active: false }).eq("id", id);
      if (error) throw error;
      toast.success("Technician removed");
      fetchTechnicians();
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  const startEdit = (tech) => {
    setEditingId(tech.id);
    setFormData({ name: tech.name, email: tech.email || "", phone: tech.phone || "", specialty: tech.specialty || "" });
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const TechForm = ({ onSave, onCancel }) => (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FloatingLabelInput id="tech-name" name="name" label="Name" value={formData.name} onChange={handleInputChange} />
          <FloatingLabelInput id="tech-email" name="email" label="Email" value={formData.email} onChange={handleInputChange} autoCapitalize={false} />
          <FloatingLabelInput id="tech-phone" name="phone" label="Phone" value={formData.phone} onChange={handleInputChange} />
          <FloatingLabelInput id="tech-specialty" name="specialty" label="Specialty" value={formData.specialty} onChange={handleInputChange} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} className="flex-1">
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white h-8 px-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">Technicians</h1>
          <Button size="sm" variant="outline" className="h-8" onClick={() => { setShowAddForm(true); setFormData({ name: "", email: "", phone: "", specialty: "" }); }}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 space-y-3">
        {showAddForm && (
          <TechForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : technicians.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No technicians added yet.</p>
            </CardContent>
          </Card>
        ) : (
          technicians.map((tech) => (
            editingId === tech.id ? (
              <TechForm key={tech.id} onSave={() => handleUpdate(tech.id)} onCancel={() => setEditingId(null)} />
            ) : (
              <Card key={tech.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">{tech.name}</span>
                        {tech.specialty && (
                          <Badge variant="secondary" className="text-xs">{tech.specialty}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pl-6">
                        {tech.email && (
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{tech.email}</span>
                        )}
                        {tech.phone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{tech.phone}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(tech)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(tech.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))
        )}
      </div>
    </div>
  );
};

export default TechniciansPage;
