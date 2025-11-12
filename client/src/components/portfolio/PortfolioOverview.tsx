import { Wallet, TrendingUp, TrendingDown, Coins, BarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Wallet as WalletType } from "@shared/schema";

interface PortfolioOverviewProps {
  wallets: WalletType[];
}

export function PortfolioOverview({ wallets }: PortfolioOverviewProps) {
  // Calculate portfolio stats
  const totalValue = wallets.reduce((sum, wallet) => sum + wallet.balanceUsd, 0);

  const totalChange24h = wallets.reduce((sum, wallet) => {
    const walletChange = wallet.tokens.reduce((tokenSum, token) => {
      const previousValue = token.value / (1 + token.change24h / 100);
      const change = token.value - previousValue;
      return tokenSum + change;
    }, 0);
    return sum + walletChange;
  }, 0);

  const change24hPercent = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0;

  const walletsCount = wallets.length;

  const tokensCount = wallets.reduce(
    (sum, wallet) => sum + wallet.tokens.length,
    0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const isPositive = change24hPercent >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Value */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Value</p>
            <BarChart className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
        </CardContent>
      </Card>

      {/* 24h Change */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">24h Change</p>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(totalChange24h)}
            </p>
            <p className={`text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {formatPercent(change24hPercent)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Wallets Count */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Wallets</p>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-white">{walletsCount}</p>
        </CardContent>
      </Card>

      {/* Tokens Count */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Tokens</p>
            <Coins className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-white">{tokensCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
