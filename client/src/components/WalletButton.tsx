import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Wallet, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WalletButton() {
  const { publicKey, connect, disconnect, connecting, connected, select, wallets } = useWallet();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      // Select Phantom wallet first
      const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
      if (phantomWallet) {
        select(phantomWallet.adapter.name);
      }
      
      // Then connect
      await connect();
      
      if (publicKey) {
        toast({
          title: "Wallet Connected",
          description: `Connected to ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`,
        });
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      
      // Check if user needs to install Phantom
      if (error.name === 'WalletNotFoundError' || error.name === 'WalletNotReadyError') {
        toast({
          title: "Phantom Not Found",
          description: "Please install Phantom wallet extension to connect.",
          variant: "destructive",
        });
        window.open("https://phantom.app/", "_blank");
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect to wallet.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
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

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" data-testid="wallet-connected-indicator" />
          <span className="text-sm font-mono text-primary" data-testid="wallet-address">
            {formatAddress(publicKey.toString())}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDisconnect}
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
      onClick={handleConnect}
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
