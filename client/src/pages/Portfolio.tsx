import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddWalletDialog } from "@/components/portfolio/AddWalletDialog";
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview";
import { WalletCard } from "@/components/portfolio/WalletCard";
import { EmptyState } from "@/components/portfolio/EmptyState";
import type { Wallet } from "@shared/schema";

export default function Portfolio() {
  const { data: wallets, isLoading, error, refetch, isRefetching } = useQuery<Wallet[]>({
    queryKey: ["/api/wallets"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Portfolio</h1>
              <p className="text-muted-foreground mt-1">
                Track your Solana and BSC wallet holdings
              </p>
            </div>
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

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
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
          <EmptyState />
        )}

        {/* Portfolio Content */}
        {!isLoading && !error && wallets && wallets.length > 0 && (
          <div className="space-y-6">
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
    </div>
  );
}
