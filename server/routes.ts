import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import axios from "axios";
import type { CryptoPrice, NewsArticle, Tweet, WSMessage, Wallet, Token } from "@shared/schema";
import { storage } from "./storage";
import { solanaService } from "./services/solanaService";
import { bscService } from "./services/bscService";
import { priceService } from "./services/priceService";
import { addWalletSchema, updateWalletLabelSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { verifyUserSession, getUserProfile, updateUserProfile, getUserWallets, addUserWallet, deleteUserWallet } from "./services/supabase";
import { hasSpecialBadge, getUserRoles } from "./services/discord";
import { chatService } from "./services/chatService";

// Twitter API configuration
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || '';

// In-memory cache
let cachedPrices: CryptoPrice[] = [];
let cachedNews: NewsArticle[] = [];
let cachedTweets: Tweet[] = [];

// Tweet cache with timestamp (10 minute TTL)
const TWEET_CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
let tweetCache: {
  data: Tweet[];
  timestamp: number;
} = {
  data: [],
  timestamp: 0,
};

// Fetch crypto prices from CoinGecko
async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: 'bitcoin,ethereum,binancecoin,solana',
        order: 'market_cap_desc',
        sparkline: true,
        price_change_percentage: '24h',
      },
    });

    return response.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      current_price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
      price_change_24h: coin.price_change_24h || 0,
      market_cap: coin.market_cap,
      total_volume: coin.total_volume,
      high_24h: coin.high_24h,
      low_24h: coin.low_24h,
      sparkline_in_7d: coin.sparkline_in_7d,
      last_updated: coin.last_updated,
    }));
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return cachedPrices; // Return cached data on error
  }
}

// Fetch crypto news from CryptoPanic
async function fetchCryptoNews(): Promise<NewsArticle[]> {
  try {
    // CryptoPanic public API (free tier, no auth required for public filter)
    const response = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      params: {
        auth_token: 'free', // Use 'free' for public posts without authentication
        public: 'true',
        kind: 'news',
        filter: 'rising',
      },
    });

    return response.data.results.slice(0, 20).map((post: any) => ({
      id: post.id.toString(),
      title: post.title,
      url: post.url,
      source: post.source?.title || 'CryptoPanic',
      published_at: post.published_at,
      domain: post.domain,
      votes: post.votes,
      currencies: post.currencies || [],
    }));
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    
    // Fallback: Try alternative free news source or return cached
    try {
      // Alternative: Use NewsAPI with crypto keywords (requires API key)
      // For MVP, we'll return mock data structure with cached news
      if (cachedNews.length > 0) return cachedNews;
      
      // Return sample news if nothing is cached
      return [
        {
          id: '1',
          title: 'Bitcoin reaches new milestone as institutional adoption grows',
          url: 'https://example.com',
          source: 'Crypto News',
          published_at: new Date().toISOString(),
          domain: 'example.com',
        },
        {
          id: '2',
          title: 'Ethereum network upgrade brings significant improvements',
          url: 'https://example.com',
          source: 'Blockchain Daily',
          published_at: new Date().toISOString(),
          domain: 'example.com',
        },
      ];
    } catch {
      return cachedNews;
    }
  }
}

// Check if tweet cache is still valid
function isTweetCacheValid(): boolean {
  return Date.now() - tweetCache.timestamp < TWEET_CACHE_TTL;
}

// Fetch tweets from Twitter API (with caching)
async function fetchTweets(forceRefresh: boolean = false): Promise<Tweet[]> {
  // Return cached tweets if still valid and not forcing refresh
  if (!forceRefresh && isTweetCacheValid() && tweetCache.data.length > 0) {
    console.log('[Twitter] Serving tweets from cache (age: ' + Math.floor((Date.now() - tweetCache.timestamp) / 1000) + 's)');
    return tweetCache.data;
  }

  if (!TWITTER_BEARER_TOKEN) {
    console.warn('[Twitter] API credentials not configured - using mock data');
    const mockTweets = [
      {
        id: '1',
        text: 'Bitcoin looking strong today! The market momentum is building. 📈 #BTC #Crypto',
        author_id: '1',
        author_name: 'Crypto Expert',
        author_username: 'cryptoexpert',
        author_verified: true,
        created_at: new Date().toISOString(),
        public_metrics: {
          retweet_count: 245,
          reply_count: 89,
          like_count: 1203,
          quote_count: 45,
        },
      },
      {
        id: '2',
        text: 'The future of decentralized finance is here. Exciting times ahead for ETH and the entire ecosystem! 🚀',
        author_id: '2',
        author_name: 'DeFi Analyst',
        author_username: 'defianalyst',
        author_verified: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        public_metrics: {
          retweet_count: 156,
          reply_count: 67,
          like_count: 892,
          quote_count: 34,
        },
      },
    ];

    // Cache mock tweets too
    tweetCache = {
      data: mockTweets,
      timestamp: Date.now(),
    };

    return mockTweets;
  }

  try {
    console.log('[Twitter] Fetching fresh tweets from API');

    // Twitter API v2 - Fetch tweets from curated list
    // List: https://x.com/i/lists/1731964315962417340
    const listId = '1731964315962417340';
    const response = await axios.get(`https://api.twitter.com/2/lists/${listId}/tweets`, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
      params: {
        max_results: 20,
        'tweet.fields': 'created_at,public_metrics,author_id',
        'expansions': 'author_id',
        'user.fields': 'name,username,profile_image_url,verified',
      },
    });

    const users = response.data.includes?.users || [];
    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const tweets = response.data.data.map((tweet: any) => {
      const author = userMap.get(tweet.author_id) || {};
      return {
        id: tweet.id,
        text: tweet.text,
        author_id: tweet.author_id,
        author_name: author.name || 'Unknown',
        author_username: author.username || 'unknown',
        author_profile_image: author.profile_image_url,
        author_verified: author.verified || false,
        created_at: tweet.created_at,
        public_metrics: tweet.public_metrics,
      };
    });

    // Update cache with fresh data
    tweetCache = {
      data: tweets,
      timestamp: Date.now(),
    };

    cachedTweets = tweets; // Keep for backwards compatibility
    console.log(`[Twitter] Cached ${tweets.length} tweets (TTL: ${TWEET_CACHE_TTL / 1000}s)`);

    return tweets;
  } catch (error) {
    console.error('[Twitter] Error fetching tweets:', error);

    // Return cached data if available, even if expired
    if (tweetCache.data.length > 0) {
      console.log('[Twitter] API error - serving stale cache');
      return tweetCache.data;
    }

    // Fallback to cachedTweets for backwards compatibility
    return cachedTweets;
  }
}

// Broadcast to all connected WebSocket clients
function broadcastToClients(wss: WebSocketServer, message: WSMessage) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // REST API endpoints
  app.get('/api/crypto/prices', async (_req, res) => {
    try {
      const prices = await fetchCryptoPrices();
      cachedPrices = prices;
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch crypto prices' });
    }
  });

  app.get('/api/news', async (_req, res) => {
    try {
      const news = await fetchCryptoNews();
      cachedNews = news;
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch news' });
    }
  });

  // Tweets API - serves from cache (10min TTL) to reduce Twitter API usage
  app.get('/api/tweets', async (_req, res) => {
    try {
      // fetchTweets() automatically uses cache if valid, otherwise fetches fresh
      const tweets = await fetchTweets();
      res.json(tweets);
    } catch (error) {
      console.error('[Twitter] Error in /api/tweets route:', error);
      res.status(500).json({ error: 'Failed to fetch tweets' });
    }
  });

  // Stream management API routes
  app.get('/api/stream/config', async (_req, res) => {
    try {
      const { getMediaServerConfig } = await import('./mediaServer');
      const config = getMediaServerConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stream config' });
    }
  });

  app.get('/api/stream/status', async (req, res) => {
    try {
      const { isStreamActive, getDefaultStreamKey } = await import('./mediaServer');
      const streamKey = (req.query.key as string) || getDefaultStreamKey();
      const active = isStreamActive(streamKey);
      res.json({ streamKey, active });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stream status' });
    }
  });

  // Playlist API routes
  app.get('/api/playlist/videos', async (_req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const playlistDir = path.join(process.cwd(), 'media', 'playlist');

      // Check if directory exists
      if (!fs.existsSync(playlistDir)) {
        return res.json([]);
      }

      // Read all video files
      const files = fs.readdirSync(playlistDir);
      const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov'];

      const videos = files
        .filter(file => videoExtensions.some(ext => file.toLowerCase().endsWith(ext)))
        .map(file => ({
          name: file,
          url: `/media/playlist/${encodeURIComponent(file)}`,
          path: path.join(playlistDir, file),
        }));

      res.json(videos);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      res.status(500).json({ error: 'Failed to fetch playlist' });
    }
  });

  app.post('/api/stream/generate-key', async (_req, res) => {
    try {
      const { generateStreamKey } = await import('./mediaServer');
      const newKey = generateStreamKey();
      res.json({ streamKey: newKey });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate stream key' });
    }
  });

  // Authentication API Routes
  // Get current user session and profile
  app.get('/api/auth/session', async (req, res) => {
    try {
      const userId = await verifyUserSession(req.headers.authorization);

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const profile = await getUserProfile(userId);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('[Auth] Error fetching session:', error);
      res.status(500).json({ error: 'Failed to fetch session' });
    }
  });

  // Sync Discord roles and check for special badge
  app.post('/api/auth/discord-roles', async (req, res) => {
    try {
      const userId = await verifyUserSession(req.headers.authorization);

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const profile = await getUserProfile(userId);

      if (!profile || !profile.discord_id) {
        return res.status(400).json({ error: 'Discord not linked' });
      }

      // Fetch user roles from Discord
      const roles = await getUserRoles(
        profile.discord_id,
        process.env.DISCORD_GUILD_ID!
      );

      // Check if user has special badge role
      const hasBadge = await hasSpecialBadge(profile.discord_id);

      // Update profile with roles and badge status
      const updatedProfile = await updateUserProfile(userId, {
        discord_roles: roles,
        has_special_badge: hasBadge
      });

      res.json({
        roles,
        has_special_badge: hasBadge,
        profile: updatedProfile
      });
    } catch (error) {
      console.error('[Auth] Error syncing Discord roles:', error);
      res.status(500).json({ error: 'Failed to sync Discord roles' });
    }
  });

  // Portfolio API Routes
  // Get all wallets with balances
  app.get("/api/wallets", async (req, res) => {
    try {
      // Require authentication to prevent exposure of wallet addresses
      const userId = await verifyUserSession(req.headers.authorization);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to view wallets' });
      }

      const storedWallets = await storage.getWallets();
      const wallets: Wallet[] = [];

      for (const storedWallet of storedWallets) {
        let nativeBalance = 0;
        let tokens: Token[] = [];
        let hasError = false;

        try {
          if (storedWallet.blockchain === "solana") {
            const { sol, tokens: solTokens } = await solanaService.getWalletBalance(storedWallet.address);
            nativeBalance = sol;

            // Get prices for all tokens including SOL
            const symbols = ["SOL", ...solTokens.map(t => t.symbol)];
            const prices = await priceService.getTokenPrices(symbols);

            // Add SOL as a token
            if (sol > 0) {
              tokens.push({
                symbol: "SOL",
                name: "Solana",
                amount: sol,
                price: prices["SOL"]?.usd || 0,
                value: sol * (prices["SOL"]?.usd || 0),
                change24h: prices["SOL"]?.usd_24h_change || 0,
              });
            }

            // Add other tokens
            for (const token of solTokens) {
              const price = prices[token.symbol]?.usd || 0;
              tokens.push({
                symbol: token.symbol,
                name: token.name,
                amount: token.amount,
                price: price,
                value: token.amount * price,
                change24h: prices[token.symbol]?.usd_24h_change || 0,
              });
            }
          } else if (storedWallet.blockchain === "bsc") {
            const { bnb, tokens: bscTokens } = await bscService.getWalletBalance(storedWallet.address);
            nativeBalance = bnb;

            // Get prices for all tokens including BNB
            const symbols = ["BNB", ...bscTokens.map(t => t.symbol)];
            const prices = await priceService.getTokenPrices(symbols);

            // Add BNB as a token
            if (bnb > 0) {
              tokens.push({
                symbol: "BNB",
                name: "Binance Coin",
                amount: bnb,
                price: prices["BNB"]?.usd || 0,
                value: bnb * (prices["BNB"]?.usd || 0),
                change24h: prices["BNB"]?.usd_24h_change || 0,
              });
            }

            // Add other tokens
            for (const token of bscTokens) {
              const price = prices[token.symbol]?.usd || 0;
              tokens.push({
                symbol: token.symbol,
                name: token.name,
                amount: token.amount,
                price: price,
                value: token.amount * price,
                change24h: prices[token.symbol]?.usd_24h_change || 0,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching balance for wallet ${storedWallet.id}:`, error);
          hasError = true;
        }

        const balanceUsd = tokens.reduce((sum, t) => sum + t.value, 0);

        wallets.push({
          id: storedWallet.id,
          address: storedWallet.address,
          label: storedWallet.label,
          blockchain: storedWallet.blockchain,
          balance: nativeBalance,
          balanceUsd: balanceUsd,
          tokens: tokens,
        });
      }

      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ error: "Failed to fetch wallets" });
    }
  });

  // Add a new wallet
  app.post("/api/wallets", async (req, res) => {
    try {
      // Require authentication to prevent spam
      const userId = await verifyUserSession(req.headers.authorization);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to add wallets' });
      }

      const validationResult = addWalletSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ error: validationError.message });
      }

      const { address, label, blockchain } = validationResult.data;

      // Check for duplicate wallet address
      const existingWallet = await storage.getWalletByAddress(address, blockchain);
      if (existingWallet) {
        return res.status(400).json({ error: "This wallet address is already added to your portfolio" });
      }

      // Validate the address format by attempting to fetch balance
      try {
        if (blockchain === "solana") {
          await solanaService.getWalletBalance(address);
        } else {
          await bscService.getWalletBalance(address);
        }
      } catch (error) {
        return res.status(400).json({
          error: `Invalid ${blockchain.toUpperCase()} wallet address or unable to fetch balance. Please check the address and try again.`
        });
      }

      const wallet = await storage.addWallet({
        address,
        label: label || "Unnamed Wallet",
        blockchain,
      });

      res.json(wallet);
    } catch (error) {
      console.error("Error adding wallet:", error);
      res.status(500).json({ error: "Failed to add wallet" });
    }
  });

  // Remove a wallet
  app.delete("/api/wallets/:id", async (req, res) => {
    try {
      // Require authentication to prevent unauthorized deletions
      const userId = await verifyUserSession(req.headers.authorization);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to remove wallets' });
      }

      const { id } = req.params;
      const success = await storage.removeWallet(id);

      if (!success) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing wallet:", error);
      res.status(500).json({ error: "Failed to remove wallet" });
    }
  });

  // Update wallet label
  app.patch("/api/wallets/:id", async (req, res) => {
    try {
      // Require authentication to prevent unauthorized modifications
      const userId = await verifyUserSession(req.headers.authorization);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to update wallets' });
      }

      const { id } = req.params;

      const validationResult = updateWalletLabelSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ error: validationError.message });
      }

      const { label } = validationResult.data;
      const wallet = await storage.updateWalletLabel(id, label);

      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      res.json(wallet);
    } catch (error) {
      console.error("Error updating wallet:", error);
      res.status(500).json({ error: "Failed to update wallet" });
    }
  });

  // User Wallet API Routes (requires authentication)
  // Get logged-in user's saved wallets
  app.get("/api/user/wallets", async (req, res) => {
    try {
      const userId = await verifyUserSession(req.headers.authorization);

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const wallets = await getUserWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching user wallets:", error);
      res.status(500).json({ error: "Failed to fetch user wallets" });
    }
  });

  // Save a wallet to user's profile
  app.post("/api/user/wallets", async (req, res) => {
    try {
      const userId = await verifyUserSession(req.headers.authorization);

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validationResult = addWalletSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ error: validationError.message });
      }

      const { address, label, blockchain } = validationResult.data;

      // Validate the address format by attempting to fetch balance
      try {
        if (blockchain === "solana") {
          await solanaService.getWalletBalance(address);
        } else {
          await bscService.getWalletBalance(address);
        }
      } catch (error) {
        return res.status(400).json({
          error: `Invalid ${blockchain.toUpperCase()} wallet address or unable to fetch balance.`
        });
      }

      const wallet = await addUserWallet(userId, address, blockchain, label || "Unnamed Wallet");

      if (!wallet) {
        return res.status(500).json({ error: "Failed to save wallet" });
      }

      res.json(wallet);
    } catch (error) {
      console.error("Error saving user wallet:", error);
      res.status(500).json({ error: "Failed to save wallet" });
    }
  });

  // Delete a user's saved wallet
  app.delete("/api/user/wallets/:id", async (req, res) => {
    try {
      const userId = await verifyUserSession(req.headers.authorization);

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const success = await deleteUserWallet(id, userId);

      if (!success) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user wallet:", error);
      res.status(500).json({ error: "Failed to delete wallet" });
    }
  });

  // Copy Trading API Routes
  // Get top traders leaderboard
  app.get("/api/copytrading/traders", async (_req, res) => {
    try {
      // Mock data for traders - replace with real data from database/blockchain
      const traders = [
        {
          address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
          roi: 45.8,
          winRate: 78.5,
          trades: 156,
          totalVolume: 245000,
          followers: 342,
        },
        {
          address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
          roi: 38.2,
          winRate: 72.1,
          trades: 203,
          totalVolume: 189000,
          followers: 287,
        },
        {
          address: "4qYPZzGLqMMJYNt6fLhgkWQrQVQrJfVVEyxQCXq5z3Ux",
          roi: 32.5,
          winRate: 68.9,
          trades: 134,
          totalVolume: 156000,
          followers: 198,
        },
        {
          address: "HpGRXoFZKzPu6W1VZvMkBvFqRXZbJmRZxHpfqJW8p9Xz",
          roi: 28.7,
          winRate: 65.4,
          trades: 98,
          totalVolume: 123000,
          followers: 165,
        },
        {
          address: "2kZ8qYXvFZ7RxEJqYjZVQQXwVQxYzPgFhJwXqP9zXpQz",
          roi: 24.3,
          winRate: 61.2,
          trades: 87,
          totalVolume: 98000,
          followers: 142,
        },
      ];

      res.json(traders);
    } catch (error) {
      console.error("Error fetching traders:", error);
      res.status(500).json({ error: "Failed to fetch traders" });
    }
  });

  // Get user's copy trading data
  app.get("/api/copytrading/user/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;

      // Mock user data - replace with real data from database
      const userData = {
        walletAddress,
        portfolioValue: 12500,
        followedTraders: [
          {
            address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
            roi: 45.8,
            trades: 23,
            followedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        totalTrades: 23,
      };

      res.json(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Follow a trader
  app.post("/api/copytrading/user/:walletAddress/follow", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const { traderAddress } = req.body;

      if (!traderAddress) {
        return res.status(400).json({ error: "Trader address is required" });
      }

      // In production, save this to database
      console.log(`User ${walletAddress} following trader ${traderAddress}`);

      res.json({
        success: true,
        message: "Successfully following trader",
        traderAddress,
      });
    } catch (error) {
      console.error("Error following trader:", error);
      res.status(500).json({ error: "Failed to follow trader" });
    }
  });

  // Get portfolio history
  app.get("/api/copytrading/user/:walletAddress/portfolio-history", async (req, res) => {
    try {
      const { walletAddress } = req.params;

      // Mock portfolio history data - replace with real historical data
      const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
      let baseValue = 5000;
      const history = months.map(month => {
        baseValue += (Math.random() - 0.4) * 500;
        return {
          date: month,
          value: Math.round(baseValue),
        };
      });

      res.json(history);
    } catch (error) {
      console.error("Error fetching portfolio history:", error);
      res.status(500).json({ error: "Failed to fetch portfolio history" });
    }
  });

  // Get copy trading settings
  app.get("/api/copytrading/user/:walletAddress/settings", async (req, res) => {
    try {
      const { walletAddress } = req.params;

      // Mock settings - replace with database storage
      const settings = {
        riskMultiplier: 1.0,
        maxCollateralPerTrade: 1000,
        enabled: true,
      };

      res.json(settings);
    } catch (error) {
      console.error("Error fetching copy settings:", error);
      res.status(500).json({ error: "Failed to fetch copy settings" });
    }
  });

  // Update copy trading settings
  app.post("/api/copytrading/user/:walletAddress/settings", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const { riskMultiplier, maxCollateralPerTrade, enabled } = req.body;

      // Mock update - replace with database storage
      console.log(`Updated settings for ${walletAddress}:`, { riskMultiplier, maxCollateralPerTrade, enabled });

      res.json({
        success: true,
        settings: { riskMultiplier, maxCollateralPerTrade, enabled },
      });
    } catch (error) {
      console.error("Error updating copy settings:", error);
      res.status(500).json({ error: "Failed to update copy settings" });
    }
  });

  // Get recent mirrored trades
  app.get("/api/copytrading/user/:walletAddress/trades", async (req, res) => {
    try {
      const { walletAddress } = req.params;

      // Mock trades - replace with database storage
      const trades = [
        {
          tradeHash: "0x1234567890abcdef1234567890abcdef12345678",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          pairIndex: 1,
          isLong: true,
          collateral: "100",
          leverage: "10",
          status: "open",
          pnl: 0,
        },
      ];

      res.json(trades);
    } catch (error) {
      console.error("Error fetching user trades:", error);
      res.status(500).json({ error: "Failed to fetch user trades" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket server for live chat
  const chatWss = new WebSocketServer({ server: httpServer, path: '/chat' });

  // WebSocket server for copy trading events
  const copyTradingWss = new WebSocketServer({ server: httpServer, path: '/copytrading' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Send initial data
    if (cachedPrices.length > 0) {
      ws.send(JSON.stringify({ type: 'price_update', data: cachedPrices }));
    }
    if (cachedNews.length > 0) {
      ws.send(JSON.stringify({ type: 'news_update', data: cachedNews }));
    }
    if (cachedTweets.length > 0) {
      ws.send(JSON.stringify({ type: 'tweet_update', data: cachedTweets }));
    }

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Copy Trading WebSocket handler
  copyTradingWss.on('connection', (ws) => {
    console.log('[CopyTrading] New WebSocket connection');
    let userWallet: string | null = null;

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'subscribe') {
          userWallet = payload.walletAddress;
          console.log(`[CopyTrading] User ${userWallet} subscribed to events`);

          // Send connection confirmation
          ws.send(JSON.stringify({
            type: 'connected',
            message: 'Connected to copy trading events',
          }));

          // Send initial status
          ws.send(JSON.stringify({
            type: 'status',
            data: {
              connected: true,
              message: 'Real-time BSC events + block sync active',
            },
          }));
        }
      } catch (error) {
        console.error('[CopyTrading] Error processing message:', error);
      }
    });

    ws.on('close', () => {
      if (userWallet) {
        console.log(`[CopyTrading] User ${userWallet} disconnected`);
      }
    });

    ws.on('error', (error) => {
      console.error('[CopyTrading] WebSocket error:', error);
    });
  });

  // Function to broadcast copy trading events to all connected clients
  function broadcastCopyTradingEvent(event: any) {
    const messageStr = JSON.stringify(event);
    copyTradingWss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Simulate copy trading events (in production, this would be triggered by AsterDEX events)
  setInterval(() => {
    const mockEvent = {
      type: 'trade_mirrored',
      data: {
        tradeHash: `0x${Math.random().toString(16).slice(2, 42)}`,
        timestamp: new Date().toISOString(),
        pairIndex: Math.floor(Math.random() * 10),
        isLong: Math.random() > 0.5,
        collateral: (Math.random() * 500 + 100).toFixed(2),
        leverage: Math.floor(Math.random() * 10 + 1).toString(),
        status: 'open',
      },
    };

    // Only broadcast occasionally
    if (Math.random() > 0.95) {
      broadcastCopyTradingEvent(mockEvent);
    }
  }, 5000);

  // Chat WebSocket handler
  chatWss.on('connection', (ws) => {
    console.log('[Chat] New connection');
    let userId: string | null = null;

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'join') {
          // User joining chat
          userId = payload.userId || `anon-${Date.now()}`;
          const username = payload.username || `Guest${Math.floor(Math.random() * 1000)}`;
          const avatar = payload.avatar;

          chatService.addClient(userId, username, avatar, ws);
        } else if (payload.type === 'message' && userId) {
          // User sending message
          chatService.sendMessage(userId, payload.message);
        }
      } catch (error) {
        console.error('[Chat] Error processing message:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        chatService.removeClient(userId);
      }
    });

    ws.on('error', (error) => {
      console.error('[Chat] WebSocket error:', error);
    });
  });

  // Periodic updates
  // Update crypto prices every 30 seconds
  setInterval(async () => {
    try {
      const prices = await fetchCryptoPrices();
      if (prices.length > 0) {
        cachedPrices = prices;
        broadcastToClients(wss, { type: 'price_update', data: prices });
      }
    } catch (error) {
      console.error('Error in price update interval:', error);
    }
  }, 30000);

  // Update news every 2 minutes
  setInterval(async () => {
    try {
      const news = await fetchCryptoNews();
      if (news.length > 0) {
        cachedNews = news;
        broadcastToClients(wss, { type: 'news_update', data: news });
      }
    } catch (error) {
      console.error('Error in news update interval:', error);
    }
  }, 120000);

  // Update tweets every 10 minutes (reduced from 1 minute to save API credits)
  setInterval(async () => {
    try {
      const tweets = await fetchTweets(true); // Force refresh every interval
      if (tweets.length > 0) {
        cachedTweets = tweets;
        broadcastToClients(wss, { type: 'tweet_update', data: tweets });
      }
    } catch (error) {
      console.error('[Twitter] Error in tweet update interval:', error);
    }
  }, TWEET_CACHE_TTL); // 600000ms = 10 minutes

  // Initial fetch
  fetchCryptoPrices().then(prices => { cachedPrices = prices; });
  fetchCryptoNews().then(news => { cachedNews = news; });
  fetchTweets().then(tweets => { cachedTweets = tweets; });

  return httpServer;
}
