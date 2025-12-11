import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { getDefaultLogos } from "@/utils/tenantLogos";

const LoginPage = () => {
  const [agentId, setAgentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loadTenantData } = useTenant();
  const logos = getDefaultLogos();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const profile = await loadTenantData(agentId);
      
      if (profile) {
        localStorage.setItem("authenticated", "true");
        localStorage.setItem("agentId", profile.agent_id);
        if (profile.phone) {
          localStorage.setItem("agentPhone", profile.phone);
        }
        toast.success("Access granted");
        navigate("/landing");
      } else {
        toast.error("Invalid Agent ID");
        setAgentId("");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Login failed. Please try again.");
      setAgentId("");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/30 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/30 via-transparent to-transparent" />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Solid white card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
          {/* Logos */}
          <div className="flex justify-center items-center gap-6 mb-6">
            <img 
              src={logos.georges} 
              alt="George's Plumbing" 
              className="h-14 md:h-16 object-contain"
            />
            <img 
              src={logos.polaron} 
              alt="Polaron" 
              className="h-14 md:h-16 object-contain"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              Sales Portal
            </h1>
            <p className="text-slate-600 text-sm">
              Enter your credentials to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-slate-700 font-medium">
                Agent ID
              </label>
              <Input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="Enter your agent ID"
                className="w-full h-12 bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                autoFocus
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading || !agentId}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Portal
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-slate-500 text-xs mt-8">
            Secure access for authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
