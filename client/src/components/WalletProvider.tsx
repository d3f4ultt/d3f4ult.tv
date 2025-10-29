import { useMemo, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

interface Props {
  children: ReactNode;
}

export function WalletProvider({ children }: Props) {
  // Use mainnet endpoint
  const endpoint = useMemo(() => 'https://api.mainnet-beta.solana.com', []);

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
