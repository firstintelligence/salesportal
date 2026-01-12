import { useState } from "react";
import { 
  CheckCircle2, User, Calendar, CreditCard, MapPin, 
  Loader2, Edit2, Save, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const IDScanResult = ({ scanData, onApprove, onEdit, isSubmitting }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(scanData);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-CA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const isExpirySoon = () => {
    if (!scanData.idExpiry) return false;
    const expiry = new Date(scanData.idExpiry);
    const today = new Date();
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    return expiry <= sixMonths && expiry > today;
  };

  const isExpired = () => {
    if (!scanData.idExpiry) return false;
    const expiry = new Date(scanData.idExpiry);
    return expiry < new Date();
  };

  const handleSave = () => {
    onEdit(editedData);
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const getConfidenceBadge = () => {
    const confidence = scanData.confidence || 'medium';
    const colors = {
      high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return (
      <Badge className={colors[confidence]}>
        {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
      </Badge>
    );
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit ID Information</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input 
              value={editedData.firstName || ''} 
              onChange={(e) => handleChange('firstName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input 
              value={editedData.lastName || ''} 
              onChange={(e) => handleChange('lastName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input 
              type="date"
              value={editedData.dateOfBirth || ''} 
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>ID Number</Label>
            <Input 
              value={editedData.idNumber || ''} 
              onChange={(e) => handleChange('idNumber', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>ID Expiry</Label>
            <Input 
              type="date"
              value={editedData.idExpiry || ''} 
              onChange={(e) => handleChange('idExpiry', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>ID Type</Label>
            <Input 
              value={editedData.idType || ''} 
              onChange={(e) => handleChange('idType', e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Address</Label>
            <Input 
              value={editedData.address || ''} 
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input 
              value={editedData.city || ''} 
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Postal Code</Label>
            <Input 
              value={editedData.postalCode || ''} 
              onChange={(e) => handleChange('postalCode', e.target.value)}
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with confidence */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">ID Scan Complete</h3>
          <p className="text-sm text-muted-foreground">{scanData.idType || 'Ontario ID'}</p>
        </div>
        <div className="flex items-center gap-2">
          {getConfidenceBadge()}
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ID Preview thumbnail */}
      {scanData.imageBase64 && (
        <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 h-32">
          <img 
            src={scanData.imageBase64} 
            alt="ID Card" 
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Extracted Information */}
      <div className="space-y-4">
        {/* Name */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-semibold text-foreground">
                  {scanData.firstName} {scanData.lastName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DOB and ID Number */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-violet-500/10">
                  <Calendar className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-semibold text-foreground text-sm">
                    {formatDate(scanData.dateOfBirth)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-cyan-500/10">
                  <CreditCard className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ID Number</p>
                  <p className="font-semibold text-foreground text-sm">
                    {scanData.idNumber || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ID Expiry */}
        <Card className={isExpired() ? 'border-red-300 dark:border-red-800' : isExpirySoon() ? 'border-amber-300 dark:border-amber-800' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isExpired() ? 'bg-red-100 dark:bg-red-900/30' : isExpirySoon() ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                {isExpired() ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <Calendar className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">ID Expiry Date</p>
                <p className={`font-semibold ${isExpired() ? 'text-red-600' : isExpirySoon() ? 'text-amber-600' : 'text-foreground'}`}>
                  {formatDate(scanData.idExpiry)}
                  {isExpired() && ' (EXPIRED)'}
                  {isExpirySoon() && !isExpired() && ' (Expiring Soon)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-500/10">
                <MapPin className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-semibold text-foreground">
                  {scanData.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {scanData.city}, {scanData.province} {scanData.postalCode}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes from scan */}
        {scanData.notes && (
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
            <p className="text-xs text-muted-foreground">Scan Notes</p>
            <p className="text-sm text-foreground">{scanData.notes}</p>
          </div>
        )}
      </div>

      {/* Warning if expired */}
      {isExpired() && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">ID has expired</p>
          </div>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            This ID is no longer valid. Customer may not be eligible for rebates.
          </p>
        </div>
      )}

      {/* Check Eligibility Button */}
      <Button 
        className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
        onClick={() => onApprove(scanData)}
        disabled={isSubmitting || isExpired()}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Checking Eligibility...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Check Eligibility
          </>
        )}
      </Button>
    </div>
  );
};

export default IDScanResult;
