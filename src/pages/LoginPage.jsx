import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const VALID_PASSWORDS = ["1111", "2222", "3333"];

const LoginPage = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (VALID_PASSWORDS.includes(password)) {
      localStorage.setItem("authenticated", "true");
      toast.success("Access granted");
      navigate("/landing");
    } else {
      toast.error("Invalid password");
      setPassword("");
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 text-center text-lg tracking-wider"
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
