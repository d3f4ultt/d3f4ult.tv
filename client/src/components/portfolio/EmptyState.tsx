import { Wallet } from "lucide-react";
import { AddWalletDialog } from "./AddWalletDialog";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6">
        <Wallet className="w-16 h-16 text-purple-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">No Wallets Connected</h2>
      <p className="text-gray-400 text-center mb-6 max-w-md">
        Connect your Solana or BSC wallet to start tracking your crypto portfolio.
        Monitor your holdings, balances, and price changes in real-time.
      </p>
      <AddWalletDialog />
    </div>
  );
}
