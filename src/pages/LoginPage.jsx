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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm mx-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              Sales Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">Enter your agent ID to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value.toUpperCase())}
              placeholder="Agent ID"
              className="w-full h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl text-center tracking-widest uppercase focus:bg-white transition-colors"
              autoFocus
            />
            
            <Button 
              type="submit" 
              disabled={isLoading || !agentId}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
