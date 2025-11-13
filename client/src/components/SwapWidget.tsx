import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeftRight, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// TypeScript declarations for Jupiter Terminal
declare global {
  interface Window {
    Jupiter?: {
      init: (config: JupiterConfig) => Promise<void>;
      syncProps: (props: { passthroughWalletContextState: any }) => void;
    };
  }
}

interface JupiterConfig {
  displayMode: 'modal' | 'integrated' | 'widget';
  endpoint: string;
  enableWalletPassthrough?: boolean;
  passthroughWalletContextState?: any;
  containerClassName?: string;
}

export function SwapWidget() {
  const [isReady, setIsReady] = useState(false);
  const walletContext = useWallet();

  // Check if Jupiter script is loaded
  useEffect(() => {
    const script = document.querySelector('script[src*="terminal.jup.ag"]');
    if (!script) return;

    const onLoad = () => setIsReady(true);

    if (window.Jupiter) {
      setIsReady(true);
    } else {
      script.addEventListener('load', onLoad);
      return () => script.removeEventListener('load', onLoad);
    }
  }, []);

  // Sync wallet state with Jupiter whenever wallet connection changes
  useEffect(() => {
    if (!window.Jupiter?.syncProps || !isReady) return;

    // Pass the full wallet adapter context to Jupiter
    window.Jupiter.syncProps({ passthroughWalletContextState: walletContext });
  }, [isReady, walletContext.connected, walletContext.publicKey]);

  const openSwap = async () => {
    if (!window.Jupiter) {
      console.error('Jupiter Terminal not loaded');
      return;
    }

    try {
      // Initialize Jupiter with wallet passthrough using Helius premium RPC
      await window.Jupiter.init({
        displayMode: 'modal',
        endpoint: 'https://mainnet.helius-rpc.com/?api-key=f4bb0177-d618-4782-bda9-fadf0f63df7f',
        enableWalletPassthrough: true,
        passthroughWalletContextState: walletContext,
        containerClassName: 'max-h-[90vh] w-full',
      });

      // Sync wallet state again after init
      if (window.Jupiter.syncProps) {
        window.Jupiter.syncProps({ passthroughWalletContextState: walletContext });
      }
    } catch (error) {
      console.error('Error opening Jupiter swap:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5" />
          Token Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Section */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Swap tokens instantly using Jupiter's best-in-class aggregator
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <ArrowUpDown className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <p className="text-xs font-medium">Best Rates</p>
              <p className="text-xs text-muted-foreground">
                Aggregates across all Solana DEXs
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {walletContext.connected ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs font-medium text-green-600 dark:text-green-500">
                Wallet Connected
              </p>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {walletContext.publicKey?.toBase58()}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
              Connect wallet to start swapping
            </p>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={openSwap}
          disabled={!isReady || !walletContext.connected}
          variant="default"
          className="w-full gap-2"
          data-testid="button-open-swap"
        >
          <ArrowLeftRight className="h-4 w-4" />
          {!isReady ? 'Loading Swap...' : 'Open Swap Interface'}
        </Button>
      </CardContent>
    </Card>
  );
}
