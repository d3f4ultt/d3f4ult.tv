import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CryptoPrice } from "@shared/schema";
import { useEffect, useRef, useState } from "react";

interface PriceTickerCardProps {
  crypto: CryptoPrice;
}

export function PriceTickerCard({ crypto }: PriceTickerCardProps) {
  const [displayPrice, setDisplayPrice] = useState(crypto.current_price);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevPriceRef = useRef(crypto.current_price);

  useEffect(() => {
    if (prevPriceRef.current !== crypto.current_price) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      
      // Animate the number counting up/down
      const start = prevPriceRef.current;
      const end = crypto.current_price;
      const duration = 300;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (end - start) * progress;
        setDisplayPrice(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
      prevPriceRef.current = crypto.current_price;
      
      return () => clearTimeout(timer);
    }
  }, [crypto.current_price]);

  const isPositive = crypto.price_change_percentage_24h >= 0;
  const changeColor = isPositive ? "text-bullish" : "text-bearish";
  const bgColor = isPositive ? "bg-bullish/10" : "bg-bearish/10";

  return (
    <Card 
      className="p-6 hover-elevate transition-all duration-300"
      data-testid={`card-crypto-${crypto.symbol.toLowerCase()}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 
              className="text-sm font-medium text-muted-foreground uppercase tracking-wide"
              data-testid={`text-symbol-${crypto.symbol.toLowerCase()}`}
            >
              {crypto.symbol}
            </h3>
            <Badge 
              variant="outline" 
              className="text-xs no-default-hover-elevate no-default-active-elevate"
            >
              LIVE
            </Badge>
          </div>
          
          <div className={`font-mono text-4xl font-bold mb-2 transition-all ${isAnimating ? 'animate-count-up' : ''}`}>
            <span data-testid={`text-price-${crypto.symbol.toLowerCase()}`}>
              ${displayPrice.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              className={`${bgColor} ${changeColor} border-0 no-default-hover-elevate no-default-active-elevate`}
              data-testid={`badge-change-${crypto.symbol.toLowerCase()}`}
            >
              <span className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
              </span>
            </Badge>
            <span className={`text-sm font-medium ${changeColor}`}>
              {isPositive ? '+' : ''}
              ${crypto.price_change_24h.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
        </div>
        
        {crypto.sparkline_in_7d?.price && (
          <div className="w-20 h-16">
            <MiniSparkline 
              data={crypto.sparkline_in_7d.price} 
              isPositive={isPositive}
            />
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-muted-foreground mb-1">24h High</div>
          <div className="font-mono font-medium">${crypto.high_24h.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">24h Low</div>
          <div className="font-mono font-medium">${crypto.low_24h.toLocaleString()}</div>
        </div>
      </div>
    </Card>
  );
}

function MiniSparkline({ data, isPositive }: { data: number[], isPositive: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  const color = isPositive ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)';
  
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
