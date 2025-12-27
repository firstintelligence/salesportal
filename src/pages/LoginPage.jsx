import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

const LoginPage = () => {
  const [agentId, setAgentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loadTenantData } = useTenant();

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
    <div className="min-h-screen md:min-h-screen py-8 md:py-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-6 relative z-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-6">
            <p className="text-slate-600 text-sm font-medium">Enter your agent ID to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block pl-1">Agent ID</label>
              <Input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value.toUpperCase())}
                placeholder="Enter your ID"
                className="w-full h-12 bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl text-center text-base tracking-[0.2em] uppercase focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
                autoFocus
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading || !agentId}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium text-base shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-500 mt-6">
          Secure access for authorized agents
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
