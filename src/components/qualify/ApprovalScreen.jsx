import { CheckCircle2, User, MapPin, Calendar, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const ApprovalScreen = ({ profileData, onDone, onScanAnother }) => {
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

  return (
    <div className="space-y-6">
      {/* Success Animation */}
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="flex flex-col items-center py-8"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          className="relative"
        >
          <div className="w-28 h-28 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600" strokeWidth={1.5} />
          </div>
          {/* Sparkle effects */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-amber-500" />
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="absolute -bottom-1 -left-2"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-center mt-6"
        >
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Approved!
          </h2>
          <p className="text-muted-foreground mt-1">
            Eligible for Rebate Program
          </p>
        </motion.div>
      </motion.div>

      {/* Profile Summary */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-5 space-y-4">
            {/* Name */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <User className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-bold text-lg text-foreground">
                  {profileData.firstName} {profileData.lastName}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <MapPin className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Property Address</p>
                <p className="font-semibold text-foreground">{profileData.address}</p>
                <p className="text-sm text-muted-foreground">
                  {profileData.city}, {profileData.province} {profileData.postalCode}
                </p>
              </div>
            </div>

            {/* DOB and ID */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs text-muted-foreground">DOB</p>
                  <p className="text-sm font-medium">{formatDate(profileData.dateOfBirth)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs text-muted-foreground">ID Expiry</p>
                  <p className="text-sm font-medium">{formatDate(profileData.idExpiry)}</p>
                </div>
              </div>
            </div>

            {/* ID Number */}
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-muted-foreground">ID Number</p>
              <p className="font-mono text-sm font-semibold text-foreground">
                {profileData.idNumber}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Created Badge */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium">Profile saved to Dashboard</span>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="space-y-3 pt-4"
      >
        <Button className="w-full" onClick={onDone}>
          Back to Home
        </Button>
        <Button variant="outline" className="w-full" onClick={onScanAnother}>
          Scan Another ID
        </Button>
      </motion.div>
    </div>
  );
};

export default ApprovalScreen;
