import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type BlockchainType = "solana" | "bsc";

interface AddWalletData {
  address: string;
  label?: string;
  blockchain: BlockchainType;
}

export function AddWalletDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BlockchainType>("solana");
  const [manualAddress, setManualAddress] = useState("");
  const [walletLabel, setWalletLabel] = useState("");
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addWalletMutation = useMutation({
    mutationFn: async (data: AddWalletData) => {
      const res = await apiRequest("POST", "/api/wallets", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Wallet Added",
        description: "Your wallet has been added to your portfolio.",
      });
      setOpen(false);
      setManualAddress("");
      setWalletLabel("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddWallet = (address: string, blockchain: BlockchainType) => {
    if (!address.trim()) {
      toast({
        title: "Address Required",
        description: "Please provide a wallet address.",
        variant: "destructive",
      });
      return;
    }

    addWalletMutation.mutate({
      address: address.trim(),
      label: walletLabel.trim() || undefined,
      blockchain,
    });
  };

  const handleAddConnectedWallet = () => {
    if (!publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Phantom wallet first.",
        variant: "destructive",
      });
      return;
    }

    handleAddWallet(publicKey.toString(), "solana");
  };

  const handleAddManualWallet = () => {
    handleAddWallet(manualAddress, activeTab);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Wallet to Portfolio</DialogTitle>
          <DialogDescription>
            Connect your Solana wallet or manually enter a wallet address to track.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BlockchainType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="solana">Solana</TabsTrigger>
            <TabsTrigger value="bsc">BSC</TabsTrigger>
          </TabsList>

          <TabsContent value="solana" className="space-y-4 mt-4">
            {/* Phantom Wallet Connect Option */}
            <div className="space-y-2">
              <Label>Connect with Phantom</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !h-10 !rounded-md !text-sm" />
                </div>
                {connected && publicKey && (
                  <Button
                    onClick={handleAddConnectedWallet}
                    disabled={addWalletMutation.isPending}
                  >
                    {addWalletMutation.isPending ? "Adding..." : "Add"}
                  </Button>
                )}
              </div>
              {connected && publicKey && (
                <p className="text-xs text-muted-foreground">
                  Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                </p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Manual Address Input */}
            <div className="space-y-2">
              <Label htmlFor="solana-address">Solana Address</Label>
              <Input
                id="solana-address"
                placeholder="Enter Solana wallet address"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solana-label">Wallet Label (Optional)</Label>
              <Input
                id="solana-label"
                placeholder="e.g., My Main Wallet"
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAddManualWallet}
              disabled={addWalletMutation.isPending || !manualAddress.trim()}
              className="w-full"
            >
              {addWalletMutation.isPending ? "Adding..." : "Add Solana Wallet"}
            </Button>
          </TabsContent>

          <TabsContent value="bsc" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bsc-address">BSC Address</Label>
              <Input
                id="bsc-address"
                placeholder="Enter BSC wallet address (0x...)"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bsc-label">Wallet Label (Optional)</Label>
              <Input
                id="bsc-label"
                placeholder="e.g., Trading Wallet"
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAddManualWallet}
              disabled={addWalletMutation.isPending || !manualAddress.trim()}
              className="w-full"
            >
              {addWalletMutation.isPending ? "Adding..." : "Add BSC Wallet"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
