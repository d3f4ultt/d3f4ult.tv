import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Trader {
  address: string;
  roi: number;
  trades: number;
  winRate: number;
  followers: number;
  totalVolume: number;
}

interface TraderLeaderboardProps {
  walletAddress?: string;
  onFollow?: () => void;
}

export function TraderLeaderboard({ walletAddress, onFollow }: TraderLeaderboardProps) {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTraders();
  }, []);

  const fetchTraders = async () => {
    try {
      const response = await fetch("/api/copytrading/traders");
      if (response.ok) {
        const data = await response.json();
        setTraders(data);
      }
    } catch (error) {
      console.error("Error fetching traders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (traderAddress: string) => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to follow traders.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/copytrading/user/${walletAddress}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traderAddress }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Now following ${traderAddress.slice(0, 6)}...${traderAddress.slice(-4)}`,
        });
        onFollow?.();
      }
    } catch (error) {
      console.error("Error following trader:", error);
      toast({
        title: "Error",
        description: "Failed to follow trader. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Traders
        </CardTitle>
        <CardDescription>
          Follow the best performing traders and copy their strategies
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Trader</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Followers</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {traders.map((trader, index) => (
                  <TableRow key={trader.address}>
                    <TableCell>
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        #{index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={trader.roi >= 0 ? "text-green-500" : "text-red-500"}>
                        {trader.roi >= 0 ? "+" : ""}{trader.roi.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {trader.winRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Activity className="h-3 w-3" />
                        {trader.trades}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${(trader.totalVolume / 1000).toFixed(1)}K
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-3 w-3" />
                        {trader.followers}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleFollow(trader.address)}
                        disabled={!walletAddress}
                      >
                        Follow
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
