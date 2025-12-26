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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <h1 className="text-xl font-medium text-slate-900">
            Sales Portal
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value.toUpperCase())}
            placeholder="Agent ID"
            className="w-full h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg text-center tracking-widest uppercase"
            autoFocus
          />
          
          <Button 
            type="submit" 
            disabled={isLoading || !agentId}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium"
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
  );
};

export default LoginPage;
