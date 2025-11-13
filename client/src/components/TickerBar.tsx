import { TrendingUp, TrendingDown } from "lucide-react";
import type { CryptoPrice } from "@shared/schema";
import { PortfolioDialog } from "@/components/portfolio/PortfolioDialog";
import { SettingsPanel } from "@/components/SettingsPanel";
import { LiveIndicator } from "@/components/LiveIndicator";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { WalletButton } from "@/components/WalletButton";
import { HamburgerMenu } from "@/components/HamburgerMenu";

interface TickerBarProps {
  prices: CryptoPrice[];
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
  wsConnected?: boolean;
}

export function TickerBar({ prices, settingsOpen, onSettingsOpenChange, wsConnected }: TickerBarProps) {
  const { user, isLoading: authLoading } = useAuth();

  // Duplicate prices for seamless scrolling
  const duplicatedPrices = [...prices, ...prices, ...prices];

  return (
    <div
      className="bg-ticker border-y border-border flex items-center relative z-50"
      data-testid="ticker-bar"
    >
      {/* Hamburger Menu - Fixed on Left Side */}
      <div className="flex items-center px-4 border-r border-border bg-ticker flex-shrink-0 relative z-[100]">
        <HamburgerMenu />
      </div>

      {/* Price Ticker Container with overflow */}
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

      {/* Control Buttons - Fixed on Right Side */}
      <div className="flex items-center gap-2 px-4 border-l border-border bg-ticker flex-shrink-0">
        <PortfolioDialog />
        <WalletButton />
        {settingsOpen !== undefined && onSettingsOpenChange && (
          <SettingsPanel
            open={settingsOpen}
            onOpenChange={onSettingsOpenChange}
          />
        )}
        {wsConnected !== undefined && <LiveIndicator connected={wsConnected} />}
        <div className="w-px h-6 bg-border" />
        {!authLoading && (user ? <UserMenu /> : <LoginButton />)}
      </div>
    </div>
  );
}
