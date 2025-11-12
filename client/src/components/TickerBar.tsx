import { TrendingUp, TrendingDown } from "lucide-react";
import type { CryptoPrice } from "@shared/schema";

interface TickerBarProps {
  prices: CryptoPrice[];
}

export function TickerBar({ prices }: TickerBarProps) {
  // Duplicate prices for seamless scrolling
  const duplicatedPrices = [...prices, ...prices, ...prices];

  return (
    <div
      className="bg-ticker border-y border-border overflow-hidden flex items-center"
      data-testid="ticker-bar"
    >
      {/* Price Ticker (Full Width - Scrolling) */}
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-ticker-scroll">
          {duplicatedPrices.map((crypto, index) => {
            const isPositive = crypto.price_change_percentage_24h >= 0;
            const changeColor = isPositive ? "text-bullish" : "text-bearish";

            return (
              <div
                key={`${crypto.id}-${index}`}
                className="flex items-center gap-3 px-8 py-3 whitespace-nowrap flex-shrink-0"
              >
                <span className="font-semibold text-sm uppercase tracking-wide text-ticker-foreground">
                  {crypto.symbol}
                </span>
                <span className="font-mono font-bold text-sm text-ticker-foreground">
                  ${crypto.current_price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
                <span className={`flex items-center gap-1 text-xs font-medium ${changeColor}`}>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                </span>
                <span className="text-ticker-foreground/40">|</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
