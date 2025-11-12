import { useMemo, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

interface Props {
  children: ReactNode;
}

export function WalletProvider({ children }: Props) {
  // Use Helius premium RPC with mainnet as backup
  const endpoint = useMemo(() => 'https://mainnet.helius-rpc.com/?api-key=f4bb0177-d618-4782-bda9-fadf0f63df7f', []);

  // Initialize Phantom wallet adapter
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        {children}
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
