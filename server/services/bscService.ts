import { ethers } from "ethers";

interface TokenBalance {
  symbol: string;
  name: string;
  amount: number;
  address: string;
}

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

class BSCService {
  private provider: ethers.JsonRpcProvider;
  private rpcEndpoints: string[];
  private currentEndpointIndex: number = 0;
  private commonTokens: { address: string; symbol: string; name: string; decimals: number }[];

  constructor() {
    // Premium dRPC first, then Binance mainnet as backup
    this.rpcEndpoints = [
      "https://lb.drpc.live/bsc/AsGUZ98Ja0v8psqFQO9c7SFP1HZosp8R8LzKQrxF2MGT",
      "https://bsc-dataseed.binance.org/"
    ];

    this.provider = new ethers.JsonRpcProvider(this.rpcEndpoints[0]);

    // Common BSC tokens to check - expanded list
    this.commonTokens = [
      {
        address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 18,
      },
      {
        address: "0x55d398326f99059fF775485246999027B3197955",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 18,
      },
      {
        address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
        symbol: "BUSD",
        name: "Binance USD",
        decimals: 18,
      },
      {
        address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
        symbol: "CAKE",
        name: "PancakeSwap Token",
        decimals: 18,
      },
      {
        address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        symbol: "WBNB",
        name: "Wrapped BNB",
        decimals: 18,
      },
      {
        address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
        symbol: "ETH",
        name: "Ethereum Token",
        decimals: 18,
      },
      {
        address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
        symbol: "BTCB",
        name: "Bitcoin BEP20",
        decimals: 18,
      },
      {
        address: "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE",
        symbol: "XRP",
        name: "XRP Token",
        decimals: 18,
      },
      {
        address: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47",
        symbol: "ADA",
        name: "Cardano Token",
        decimals: 18,
      },
      {
        address: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43",
        symbol: "DOGE",
        name: "Dogecoin",
        decimals: 8,
      },
    ];
  }

  private async switchToNextEndpoint(): Promise<void> {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.rpcEndpoints.length;
    const newEndpoint = this.rpcEndpoints[this.currentEndpointIndex];
    console.log(`[BSC] Switching to backup RPC: ${newEndpoint}`);
    this.provider = new ethers.JsonRpcProvider(newEndpoint);
  }

  async getWalletBalance(address: string): Promise<{ bnb: number; tokens: TokenBalance[] }> {
    let lastError: any;

    // Try each RPC endpoint
    for (let attempt = 0; attempt < this.rpcEndpoints.length; attempt++) {
      try {
        // Get BNB balance
        const balance = await this.provider.getBalance(address);
        const bnb = parseFloat(ethers.formatEther(balance));

        const tokens: TokenBalance[] = [];

        // Check common token balances with parallel requests for better performance
        const tokenPromises = this.commonTokens.map(async (tokenInfo) => {
          try {
            const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, this.provider);
            const balance = await contract.balanceOf(address);
            const amount = parseFloat(ethers.formatUnits(balance, tokenInfo.decimals));

            if (amount > 0.000001) { // Filter out dust
              return {
                symbol: tokenInfo.symbol,
                name: tokenInfo.name,
                amount: amount,
                address: tokenInfo.address,
              };
            }
          } catch (error) {
            console.error(`Error fetching token ${tokenInfo.symbol}:`, error);
          }
          return null;
        });

        const results = await Promise.all(tokenPromises);
        tokens.push(...results.filter((t): t is TokenBalance => t !== null));

        return { bnb, tokens };
      } catch (error) {
        console.error(`[BSC] Error with RPC ${this.rpcEndpoints[this.currentEndpointIndex]}:`, error);
        lastError = error;

        // If this isn't the last attempt, switch to next endpoint
        if (attempt < this.rpcEndpoints.length - 1) {
          await this.switchToNextEndpoint();
        }
      }
    }

    // All RPCs failed
    console.error("[BSC] All RPC endpoints failed");
    throw new Error("Failed to fetch BSC wallet balance. Please check the address and try again.");
  }
}

export const bscService = new BSCService();
