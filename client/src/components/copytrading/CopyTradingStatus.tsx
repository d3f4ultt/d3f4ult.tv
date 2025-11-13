import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CopySettings {
  riskMultiplier: number;
  maxCollateralPerTrade: number;
  enabled: boolean;
}

interface MirroredTrade {
  tradeHash: string;
  timestamp: string;
  pairIndex: number;
  isLong: boolean;
  collateral: string;
  leverage: string;
  status: string;
  pnl: number;
}

interface CopyTradingStatusProps {
  walletAddress?: string;
  portfolioValue: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export function CopyTradingStatus({ walletAddress, portfolioValue }: CopyTradingStatusProps) {
  const [settings, setSettings] = useState<CopySettings>({
    riskMultiplier: 1.0,
    maxCollateralPerTrade: 1000,
    enabled: true,
  });
  const [trades, setTrades] = useState<MirroredTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (walletAddress) {
      fetchSettings();
      fetchTrades();
      connectWebSocket();
    }

    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [walletAddress]);

  // WebSocket connection
  const wsRef = React.useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    if (!walletAddress) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/copytrading`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[CopyTrading] WebSocket connected');
      setWsConnected(true);

      // Subscribe to events
      ws.send(JSON.stringify({
        type: 'subscribe',
        walletAddress,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'trade_mirrored') {
          // Add new trade to the list
          setTrades((prev) => [message.data, ...prev].slice(0, 10));

          toast({
            title: "Trade Mirrored!",
            description: `${message.data.isLong ? 'LONG' : 'SHORT'} position opened on Pair #${message.data.pairIndex}`,
          });
        } else if (message.type === 'status') {
          console.log('[CopyTrading] Status:', message.data);
        }
      } catch (error) {
        console.error('[CopyTrading] Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[CopyTrading] WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('[CopyTrading] WebSocket disconnected');
      setWsConnected(false);

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (walletAddress) {
          connectWebSocket();
        }
      }, 5000);
    };

    wsRef.current = ws;
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/copytrading/user/${walletAddress}/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await fetch(`/api/copytrading/user/${walletAddress}/trades`);
      if (response.ok) {
        const data = await response.json();
        setTrades(data);
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      const response = await fetch(`/api/copytrading/user/${walletAddress}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Settings Updated",
          description: "Your copy trading settings have been saved.",
        });
        setSettingsOpen(false);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate portfolio allocation
  const openPositionsValue = trades
    .filter(t => t.status === "open")
    .reduce((sum, t) => sum + parseFloat(t.collateral) * parseFloat(t.leverage), 0);

  const cashValue = portfolioValue - openPositionsValue;

  const allocationData = [
    { name: "Cash (USDT)", value: Math.max(cashValue, 0) },
    { name: "Open Positions", value: openPositionsValue },
  ];

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Copy Trading Settings
              </CardTitle>
              <CardDescription>
                Configure automated trade mirroring parameters
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="copy-enabled">Enabled</Label>
              <Switch
                id="copy-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => {
                  setSettings({ ...settings, enabled: checked });
                  handleSettingsUpdate();
                }}
              />
              <Badge variant={wsConnected ? "default" : "secondary"} className="ml-2">
                {wsConnected ? "Live" : "Offline"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settingsOpen ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="risk-multiplier">Risk Multiplier</Label>
                  <Input
                    id="risk-multiplier"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="2.0"
                    value={settings.riskMultiplier}
                    onChange={(e) =>
                      setSettings({ ...settings, riskMultiplier: parseFloat(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Scale trades by this factor (1.0 = 100%, 0.5 = 50%)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-collateral">Max Collateral per Trade</Label>
                  <Input
                    id="max-collateral"
                    type="number"
                    step="100"
                    min="100"
                    value={settings.maxCollateralPerTrade}
                    onChange={(e) =>
                      setSettings({ ...settings, maxCollateralPerTrade: parseFloat(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum USDT collateral per trade
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSettingsUpdate}>Save Settings</Button>
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Risk Multiplier</span>
                  <span className="text-2xl font-bold">{settings.riskMultiplier}x</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Max Collateral</span>
                  <span className="text-2xl font-bold">${settings.maxCollateralPerTrade}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={settings.enabled ? "default" : "secondary"} className="w-fit">
                    {settings.enabled ? "Active" : "Paused"}
                  </Badge>
                </div>
              </div>
              <Button onClick={() => setSettingsOpen(true)} variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Allocation
          </CardTitle>
          <CardDescription>
            Distribution of your copy trading portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Mirrored Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Mirrored Trades</CardTitle>
          <CardDescription>
            Latest trades copied from followed traders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No mirrored trades yet. Follow traders to start copying their strategies.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trades.map((trade) => (
                <div
                  key={trade.tradeHash}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Badge variant={trade.isLong ? "default" : "destructive"}>
                          {trade.isLong ? "LONG" : "SHORT"}
                        </Badge>
                        <span className="font-medium">Pair #{trade.pairIndex}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(trade.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-muted-foreground">Collateral</span>
                      <span className="font-medium">${trade.collateral}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-muted-foreground">Leverage</span>
                      <span className="font-medium">{trade.leverage}x</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-muted-foreground">PnL</span>
                      <span className={`font-medium ${trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </span>
                    </div>
                    {trade.status === "open" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Badge variant="secondary">Closed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
