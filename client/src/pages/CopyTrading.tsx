import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { TraderLeaderboard } from "@/components/copytrading/TraderLeaderboard";
import { PortfolioChart } from "@/components/copytrading/PortfolioChart";
import { FollowedTraders } from "@/components/copytrading/FollowedTraders";
import { CopyTradingStatus } from "@/components/copytrading/CopyTradingStatus";

export default function CopyTrading() {
  const { publicKey, connected } = useWallet();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/copytrading/user/${publicKey?.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your Solana wallet to access copytrading features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Copy Trading Dashboard</h1>
        <p className="text-muted-foreground">
          Follow top traders and automatically copy their successful strategies
        </p>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Value</CardTitle>
            <CardDescription>Total value in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${userData?.portfolioValue?.toLocaleString() || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Following</CardTitle>
            <CardDescription>Active trader connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userData?.followedTraders?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Traders you're copying
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Trades</CardTitle>
            <CardDescription>Copied trades this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userData?.totalTrades || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all followed traders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart */}
      <PortfolioChart walletAddress={publicKey?.toString()} />

      {/* Copy Trading Status & Settings */}
      <CopyTradingStatus
        walletAddress={publicKey?.toString()}
        portfolioValue={userData?.portfolioValue || 0}
      />

      {/* Followed Traders */}
      {userData?.followedTraders && userData.followedTraders.length > 0 && (
        <FollowedTraders
          traders={userData.followedTraders}
          onRefresh={fetchUserData}
        />
      )}

      {/* Trader Leaderboard */}
      <TraderLeaderboard
        walletAddress={publicKey?.toString()}
        onFollow={fetchUserData}
      />
    </div>
  );
}
