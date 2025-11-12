import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

interface TokenBalance {
  symbol: string;
  name: string;
  amount: number;
  mint: string;
}

class SolanaService {
  private connection: Connection;
  private rpcEndpoints: string[];
  private currentEndpointIndex: number = 0;

  constructor() {
    // Helius premium RPC first, then standard mainnet as backup
    this.rpcEndpoints = [
      "https://mainnet.helius-rpc.com/?api-key=f4bb0177-d618-4782-bda9-fadf0f63df7f",
      "https://api.mainnet-beta.solana.com"
    ];

    this.connection = new Connection(this.rpcEndpoints[0], "confirmed");
  }

  private getConnection(): Connection {
    return this.connection;
  }

  private async switchToNextEndpoint(): Promise<void> {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.rpcEndpoints.length;
    const newEndpoint = this.rpcEndpoints[this.currentEndpointIndex];
    console.log(`[Solana] Switching to backup RPC: ${newEndpoint}`);
    this.connection = new Connection(newEndpoint, "confirmed");
  }

  async getWalletBalance(address: string): Promise<{ sol: number; tokens: TokenBalance[] }> {
    let lastError: any;

    // Try each RPC endpoint
    for (let attempt = 0; attempt < this.rpcEndpoints.length; attempt++) {
      try {
        const publicKey = new PublicKey(address);

        // Get SOL balance
        const balance = await this.connection.getBalance(publicKey);
        const sol = balance / LAMPORTS_PER_SOL;

        // Get token accounts
        const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        });

        const tokens: TokenBalance[] = [];
        for (const account of tokenAccounts.value) {
          const parsedInfo = account.account.data.parsed.info;
          const amount = parsedInfo.tokenAmount.uiAmount;

          // Only include tokens with non-zero balance
          if (amount > 0) {
            tokens.push({
              symbol: this.getTokenSymbol(parsedInfo.mint),
              name: this.getTokenName(parsedInfo.mint),
              amount: amount,
              mint: parsedInfo.mint,
            });
          }
        }

        return { sol, tokens };
      } catch (error) {
        console.error(`[Solana] Error with RPC ${this.rpcEndpoints[this.currentEndpointIndex]}:`, error);
        lastError = error;

        // If this isn't the last attempt, switch to next endpoint
        if (attempt < this.rpcEndpoints.length - 1) {
          await this.switchToNextEndpoint();
        }
      }
    }

    // All RPCs failed
    console.error("[Solana] All RPC endpoints failed");
    throw lastError || new Error("Failed to fetch Solana wallet balance from all RPC endpoints");
  }

  private getTokenSymbol(mint: string): string {
    // Common Solana token mints
    const knownTokens: { [key: string]: string } = {
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
      "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
      "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "RAY",
      "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE": "ORCA",
      "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt": "SRM",
    };
    return knownTokens[mint] || mint.substring(0, 4);
  }

  private getTokenName(mint: string): string {
    const knownTokens: { [key: string]: string } = {
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USD Coin",
      "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "Tether USD",
      "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "Raydium",
      "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE": "Orca",
      "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt": "Serum",
    };
    return knownTokens[mint] || "Unknown Token";
  }
}

export const solanaService = new SolanaService();
