interface TokenPrice {
  usd: number;
  usd_24h_change: number;
}

interface PriceCache {
  [key: string]: {
    price: TokenPrice;
    timestamp: number;
  };
}

class PriceService {
  private cache: PriceCache = {};
  private cacheDuration = 60000; // 1 minute

  async getTokenPrices(symbols: string[]): Promise<{ [key: string]: TokenPrice }> {
    const now = Date.now();
    const result: { [key: string]: TokenPrice } = {};
    const tokensToFetch: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
      const cached = this.cache[symbol.toLowerCase()];
      if (cached && now - cached.timestamp < this.cacheDuration) {
        result[symbol] = cached.price;
      } else {
        tokensToFetch.push(symbol);
      }
    }

    // Fetch missing prices
    if (tokensToFetch.length > 0) {
      try {
        const coinIds = this.symbolToCoinId(tokensToFetch);
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
        );

        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Process fetched prices
        tokensToFetch.forEach((symbol) => {
          const coinId = this.symbolToCoinId([symbol])[0];
          if (data[coinId]) {
            const price: TokenPrice = {
              usd: data[coinId].usd,
              usd_24h_change: data[coinId].usd_24h_change || 0,
            };
            result[symbol] = price;
            this.cache[symbol.toLowerCase()] = {
              price,
              timestamp: now,
            };
          }
        });
      } catch (error) {
        console.error("Error fetching prices:", error);
        // Return default prices for failed fetches
        tokensToFetch.forEach((symbol) => {
          if (!result[symbol]) {
            result[symbol] = { usd: 0, usd_24h_change: 0 };
          }
        });
      }
    }

    return result;
  }

  private symbolToCoinId(symbols: string[]): string[] {
    const mapping: { [key: string]: string } = {
      SOL: "solana",
      BNB: "binancecoin",
      USDC: "usd-coin",
      USDT: "tether",
      RAY: "raydium",
      ORCA: "orca",
      SRM: "serum",
      BUSD: "binance-usd",
      CAKE: "pancakeswap-token",
      WBNB: "wbnb",
      ETH: "ethereum",
      BTCB: "bitcoin-bep2",
      XRP: "ripple",
      ADA: "cardano",
      DOGE: "dogecoin",
    };
    return symbols.map((symbol) => mapping[symbol.toUpperCase()] || symbol.toLowerCase());
  }
}

export const priceService = new PriceService();
