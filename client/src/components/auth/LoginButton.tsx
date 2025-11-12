import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export function LoginButton() {
  const { signInWithDiscord } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithDiscord();
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      variant="default"
      size="sm"
      className="gap-2"
    >
      <LogIn className="w-4 h-4" />
      {isLoading ? 'Connecting...' : 'Login with Discord'}
    </Button>
  );
}
