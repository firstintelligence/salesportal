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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      <div className="w-full max-w-md mx-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-slate-300/50">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Sales Portal
            </h1>
            <p className="text-slate-500 mt-2">Enter your agent ID to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value.toUpperCase())}
                placeholder="Agent ID"
                className="w-full h-14 bg-slate-50/50 border-slate-200/80 text-slate-900 placeholder:text-slate-400 rounded-2xl text-center text-lg tracking-[0.3em] uppercase focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all"
                autoFocus
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading || !agentId}
              className="w-full h-14 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-2xl font-medium text-base shadow-lg shadow-slate-300/30 hover:shadow-xl hover:shadow-slate-300/40 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
        
        <p className="text-center text-sm text-slate-400 mt-6">
          Secure access for authorized agents
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
