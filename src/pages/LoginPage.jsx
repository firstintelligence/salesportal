import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, ArrowRight } from "lucide-react";

// Map agent IDs to their associated phone numbers
const AGENT_CREDENTIALS = [
  { id: "MM23", phone: "+1 (905) 904-3544" },
  { id: "TB0195", phone: "+1 (416) 875-0195" },
  { id: "AA9097", phone: "+1 (647) 716-9097" },
  { id: "HB6400", phone: "+1 (647) 377-6400" },
];

const LoginPage = () => {
  const [agentId, setAgentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const agent = AGENT_CREDENTIALS.find((a) => a.id === agentId);
    if (agent) {
      localStorage.setItem("authenticated", "true");
      localStorage.setItem("agentId", agent.id);
      if (agent.phone) {
        localStorage.setItem("agentPhone", agent.phone);
      }
      toast.success("Access granted");
      navigate("/landing");
    } else {
      toast.error("Invalid Agent ID");
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
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="w-8 h-8 text-white" />
            </div>
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
