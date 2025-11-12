import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Wallet, TrendingUp, TrendingDown, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Wallet as WalletType, Token } from "@shared/schema";

export function PortfolioWidget() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("portfolio-widget-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const { data: wallets, isLoading } = useQuery<WalletType[]>({
    queryKey: ["/api/wallets"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    localStorage.setItem("portfolio-widget-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // Don't render if no wallets exist
  if (!isLoading && (!wallets || wallets.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Portfolio
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!wallets) return null;

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
  const isPositive = change24hPercent >= 0;

  // Get top 3 tokens by value across all wallets
  const allTokens: (Token & { walletLabel: string })[] = [];
  wallets.forEach((wallet) => {
    wallet.tokens.forEach((token) => {
      allTokens.push({ ...token, walletLabel: wallet.label });
    });
  });
  const topTokens = allTokens
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Portfolio
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-4">
          {/* Total Value */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <p className={`text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                  {formatPercent(change24hPercent)}
                </p>
              </div>
            </div>
          </div>

          {/* Top 3 Holdings */}
          {topTokens.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Top Holdings</p>
              <div className="space-y-2">
                {topTokens.map((token, index) => {
                  const tokenIsPositive = token.change24h >= 0;
                  return (
                    <div
                      key={`${token.symbol}-${index}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{token.symbol}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {token.walletLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{formatCurrency(token.value)}</p>
                        <p
                          className={`text-xs font-medium ${
                            tokenIsPositive ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {tokenIsPositive ? "+" : ""}
                          {token.change24h.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Link to Full Portfolio */}
          <Link href="/portfolio">
            <Button variant="outline" className="w-full group">
              View Full Portfolio
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
