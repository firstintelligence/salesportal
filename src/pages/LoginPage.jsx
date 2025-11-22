import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Map agent IDs to their associated phone numbers
const AGENT_CREDENTIALS = [
  { id: "MM23", phone: "+1 (905) 904-3544" },
  { id: "TB0195", phone: "+1 (416) 875-0195" },
];

const LoginPage = () => {
  const [agentId, setAgentId] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-xl p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Sales Portal
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your password to continue
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="Agent ID"
                className="w-full h-12 text-center text-sm"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg">
              Access Portal
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
