import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Phantom wallet types
interface PhantomProvider {
  isPhantom?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  publicKey?: { toString: () => string };
  isConnected?: boolean;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export function WalletButton() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-reconnect for trusted users (silent connection)
    const autoConnect = async () => {
      if (window.solana?.isPhantom) {
        try {
          const response = await window.solana.connect({ onlyIfTrusted: true });
          if (response.publicKey) {
            setWalletAddress(response.publicKey.toString());
          }
        } catch (error) {
          // User hasn't trusted this app yet, silently ignore
          console.debug("Auto-connect skipped: user hasn't trusted this app");
        }
      }
    };

    autoConnect();

    // Listen for wallet changes
    const handleAccountChange = (publicKey: { toString: () => string } | null) => {
      if (publicKey) {
        setWalletAddress(publicKey.toString());
      } else {
        setWalletAddress(null);
      }
    };

    // Listen for explicit disconnection from wallet
    const handleDisconnect = () => {
      setWalletAddress(null);
    };

    window.solana?.on("accountChanged", handleAccountChange);
    window.solana?.on("disconnect", handleDisconnect);

    return () => {
      window.solana?.removeListener("accountChanged", handleAccountChange);
      window.solana?.removeListener("disconnect", handleDisconnect);
    };
  }, []);

  const connectWallet = async () => {
    if (!window.solana?.isPhantom) {
      toast({
        title: "Phantom Not Found",
        description: "Please install Phantom wallet extension to connect.",
        variant: "destructive",
      });
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setConnecting(true);
    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 4)}...${address.slice(-4)}`,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Phantom wallet.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await window.solana?.disconnect();
      setWalletAddress(null);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono text-primary">{formatAddress(walletAddress)}</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={disconnectWallet}
          data-testid="button-disconnect-wallet"
          className="h-9 w-9"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={connecting}
      data-testid="button-connect-wallet"
      variant="outline"
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      {connecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
