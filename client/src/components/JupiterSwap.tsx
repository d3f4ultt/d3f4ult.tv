import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

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

export function JupiterSwap() {
  const [isReady, setIsReady] = useState(false);
  const walletContext = useWallet(); // Get wallet context from adapter

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
      // Initialize Jupiter with wallet passthrough
      await window.Jupiter.init({
        displayMode: 'modal',
        endpoint: 'https://api.mainnet-beta.solana.com',
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
    <Button
      onClick={openSwap}
      disabled={!isReady}
      variant="default"
      className="gap-2"
      data-testid="button-open-swap"
    >
      <ArrowLeftRight className="h-4 w-4" />
      {!isReady ? 'Loading...' : 'Swap Tokens'}
    </Button>
  );
}
