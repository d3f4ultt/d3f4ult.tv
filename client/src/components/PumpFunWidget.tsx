import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TokenTrade {
  mint: string;
  sol_amount: number;
  token_amount: number;
  is_buy: boolean;
  user: string;
  timestamp: number;
  tx_index: number;
  price: number;
}

interface PricePoint {
  timestamp: number;
  price: number;
}

export function PumpFunWidget() {
  const [trades, setTrades] = useState<TokenTrade[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const TOKEN_ADDRESS = '9Nj6tECrp3BG2jtMkjgkSd9Cast5nrRAQw5RBDp5pump';

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('wss://pumpportal.fun/api/data');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('PumpPortal WebSocket connected');
        setIsConnected(true);
        
        // Subscribe to trades for this specific token
        ws.send(JSON.stringify({
          method: 'subscribeTokenTrade',
          keys: [TOKEN_ADDRESS]
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TokenTrade;
          
          // Update trades list (keep last 20)
          setTrades(prev => [data, ...prev].slice(0, 20));
          
          // Update price
          if (data.price) {
            setCurrentPrice(data.price);
            
            // Update price history for chart
            setPriceHistory(prev => {
              const newPoint = { timestamp: data.timestamp, price: data.price };
              const updated = [...prev, newPoint].slice(-100); // Keep last 100 points
              return updated;
            });
          }

          // Calculate 24h volume
          setVolume24h(prev => prev + (data.sol_amount || 0));
          
        } catch (error) {
          console.error('Error parsing trade data:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('PumpPortal WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('PumpPortal WebSocket disconnected');
        setIsConnected(false);
        
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Calculate 24h price change (simplified)
  useEffect(() => {
    if (priceHistory.length >= 2) {
      const oldPrice = priceHistory[0].price;
      const change = ((currentPrice - oldPrice) / oldPrice) * 100;
      setPriceChange24h(change);
    }
  }, [currentPrice, priceHistory]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Price Header */}
      <Card className="p-4 bg-background/95 backdrop-blur border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Live Price</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-mono font-bold">
              ${currentPrice.toFixed(8)}
            </span>
            {priceChange24h !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${priceChange24h >= 0 ? 'text-success' : 'text-danger'}`}>
                {priceChange24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-semibold">
                  {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">24h Vol: </span>
              <span className="font-mono">{volume24h.toFixed(4)} SOL</span>
            </div>
            <div>
              <span className="font-medium">Trades: </span>
              <span className="font-mono">{trades.length}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Mini Price Chart */}
      <Card className="p-4 bg-background/95 backdrop-blur border-border">
        <h4 className="font-semibold mb-3">Price Chart</h4>
        <div className="h-32 flex items-end gap-1">
          {priceHistory.slice(-50).map((point, index) => {
            const maxPrice = Math.max(...priceHistory.map(p => p.price));
            const minPrice = Math.min(...priceHistory.map(p => p.price));
            const height = ((point.price - minPrice) / (maxPrice - minPrice || 1)) * 100;
            
            return (
              <div
                key={index}
                className="flex-1 bg-primary/30 rounded-t transition-all duration-300"
                style={{ height: `${height}%`, minHeight: '2px' }}
              />
            );
          })}
        </div>
        {priceHistory.length === 0 && (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            Waiting for trades...
          </div>
        )}
      </Card>

      {/* Recent Trades */}
      <Card className="flex-1 p-4 bg-background/95 backdrop-blur border-border overflow-hidden flex flex-col">
        <h4 className="font-semibold mb-3">Recent Trades</h4>
        <div className="flex-1 overflow-y-auto space-y-2">
          {trades.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No trades yet. Waiting for activity...
            </div>
          ) : (
            trades.map((trade, index) => (
              <div
                key={`${trade.timestamp}-${index}`}
                className={`p-3 rounded-lg border ${
                  trade.is_buy 
                    ? 'bg-success/10 border-success/30' 
                    : 'bg-danger/10 border-danger/30'
                }`}
                data-testid={`trade-${index}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-semibold text-sm ${
                    trade.is_buy ? 'text-success' : 'text-danger'
                  }`}>
                    {trade.is_buy ? 'BUY' : 'SELL'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono">{trade.token_amount?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-mono">{trade.sol_amount?.toFixed(4) || 'N/A'} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-mono">${trade.price?.toFixed(8) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
