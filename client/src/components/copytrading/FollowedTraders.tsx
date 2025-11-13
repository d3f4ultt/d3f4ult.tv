import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, Activity, UserMinus } from "lucide-react";

interface FollowedTrader {
  address: string;
  roi: number;
  trades: number;
  followedAt: string;
}

interface FollowedTradersProps {
  traders: FollowedTrader[];
  onRefresh?: () => void;
}

export function FollowedTraders({ traders, onRefresh }: FollowedTradersProps) {
  const { toast } = useToast();

  const handleUnfollow = async (traderAddress: string) => {
    try {
      // This would call the unfollow API endpoint
      toast({
        title: "Unfollowed",
        description: `Stopped copying ${traderAddress.slice(0, 6)}...${traderAddress.slice(-4)}`,
      });
      onRefresh?.();
    } catch (error) {
      console.error("Error unfollowing trader:", error);
      toast({
        title: "Error",
        description: "Failed to unfollow trader. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Followed Traders
        </CardTitle>
        <CardDescription>
          Traders you're currently copying
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {traders.map((trader) => (
            <Card key={trader.address} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="font-mono text-sm">
                    {trader.address.slice(0, 8)}...{trader.address.slice(-6)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUnfollow(trader.address)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ROI</span>
                    <span className={`font-bold ${trader.roi >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {trader.roi >= 0 ? "+" : ""}{trader.roi.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trades</span>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span className="font-medium">{trader.trades}</span>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Following since {new Date(trader.followedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
