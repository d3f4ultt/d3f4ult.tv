import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddWalletDialog } from "./AddWalletDialog";
import { PortfolioOverview } from "./PortfolioOverview";
import { WalletCard } from "./WalletCard";
import { EmptyState } from "./EmptyState";
import type { Wallet as WalletType } from "@shared/schema";

interface PortfolioDialogProps {
  fullWidth?: boolean;
}

export function PortfolioDialog({ fullWidth = false }: PortfolioDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: wallets, isLoading, error, refetch, isRefetching } = useQuery<WalletType[]>({
    queryKey: ["/api/wallets"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    enabled: open, // Only fetch when dialog is open
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={fullWidth ? "w-full" : ""}
          data-testid="button-portfolio"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Portfolio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <DialogTitle className="text-2xl">Portfolio</DialogTitle>
                  <DialogDescription>
                    Track your Solana and BSC wallet holdings
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefetching}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
                  </Button>
                  <AddWalletDialog />
                </div>
              </div>
            </DialogHeader>

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">Failed to load portfolio data</p>
                <Button onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && wallets && wallets.length === 0 && (
              <div className="mt-6">
                <EmptyState />
              </div>
            )}

            {/* Portfolio Content */}
            {!isLoading && !error && wallets && wallets.length > 0 && (
              <div className="space-y-6 mt-6">
                {/* Overview Stats */}
                <PortfolioOverview wallets={wallets} />

                {/* Wallets Grid */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Wallets ({wallets.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallets.map((wallet) => (
                      <WalletCard key={wallet.id} wallet={wallet} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
