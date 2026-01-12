import { CheckCircle2, User, MapPin, Calendar, CreditCard, Sparkles, Gift, Building2, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { getEligiblePrograms } from "@/utils/rebatePrograms";

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get eligible programs based on city
  const { provincialPrograms, cityPrograms, totalMaxRebate } = getEligiblePrograms(profileData.city);

  return (
    <div className="space-y-6">
      {/* Success Animation */}
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="flex flex-col items-center py-6"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-600" strokeWidth={1.5} />
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
          className="text-center mt-4"
        >
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Eligible!
          </h2>
          <p className="text-muted-foreground mt-1">
            Qualifies for rebate programs
          </p>
        </motion.div>
      </motion.div>

      {/* Rebate Amount Highlight */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5" />
                <span className="text-emerald-100 font-medium">Eligible for up to</span>
              </div>
              <p className="text-4xl font-bold tracking-tight">
                {formatCurrency(totalMaxRebate)}
              </p>
              <p className="text-emerald-100 text-sm mt-1">in combined rebates</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Provincial Programs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-foreground">Provincial Programs</h3>
        </div>
        
        <div className="space-y-2">
          {provincialPrograms.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
            >
              <Card className="border-emerald-200 dark:border-emerald-800/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{program.name}</p>
                    <p className="text-xs text-muted-foreground">{program.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Up to {formatCurrency(program.maxRebate)}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* City-Specific Programs */}
      {cityPrograms.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-foreground">{profileData.city} Programs</h3>
          </div>
          
          <div className="space-y-2">
            {cityPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
              >
                <Card className="border-blue-200 dark:border-blue-800/50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{program.name}</p>
                      <p className="text-xs text-muted-foreground">{program.description}</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Up to {formatCurrency(program.maxRebate)}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Profile Summary */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.4 }}
      >
        <Card className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer Profile</p>
            
            {/* Name */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {profileData.firstName} {profileData.lastName}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{profileData.address}</p>
                <p className="text-xs text-muted-foreground">
                  {profileData.city}, {profileData.province} {profileData.postalCode}
                </p>
              </div>
            </div>

            {/* DOB and ID */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">DOB</p>
                  <p className="text-xs font-medium">{formatDate(profileData.dateOfBirth)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">ID #</p>
                  <p className="text-xs font-mono font-medium">{profileData.idNumber}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Created Badge */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.3 }}
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
        transition={{ delay: 1.3, duration: 0.3 }}
        className="space-y-3 pt-2"
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
