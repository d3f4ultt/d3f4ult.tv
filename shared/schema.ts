import { z } from "zod";

// Crypto Price Data
export const cryptoPriceSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  price_change_percentage_24h: z.number(),
  price_change_24h: z.number(),
  market_cap: z.number(),
  total_volume: z.number(),
  high_24h: z.number(),
  low_24h: z.number(),
  sparkline_in_7d: z.object({
    price: z.array(z.number())
  }).optional(),
  last_updated: z.string(),
});

export type CryptoPrice = z.infer<typeof cryptoPriceSchema>;

// News Article
export const newsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  published_at: z.string(),
  domain: z.string().optional(),
  votes: z.object({
    positive: z.number(),
    negative: z.number(),
    important: z.number(),
  }).optional(),
  currencies: z.array(z.object({
    code: z.string(),
    title: z.string(),
  })).optional(),
});

export type NewsArticle = z.infer<typeof newsArticleSchema>;

// Twitter/X Tweet
export const tweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  author_id: z.string(),
  author_name: z.string(),
  author_username: z.string(),
  author_profile_image: z.string().optional(),
  author_verified: z.boolean().optional(),
  created_at: z.string(),
  public_metrics: z.object({
    retweet_count: z.number(),
    reply_count: z.number(),
    like_count: z.number(),
    quote_count: z.number(),
  }).optional(),
});

export type Tweet = z.infer<typeof tweetSchema>;

// Layout Mode for broadcast switching
export const layoutModeSchema = z.enum([
  'full-dashboard',
  'stream-sidebar',
  'video-overlay',
  'ticker-only'
]);

export type LayoutMode = z.infer<typeof layoutModeSchema>;

// WebSocket message types
export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("price_update"),
    data: z.array(cryptoPriceSchema),
  }),
  z.object({
    type: z.literal("news_update"),
    data: z.array(newsArticleSchema),
  }),
  z.object({
    type: z.literal("tweet_update"),
    data: z.array(tweetSchema),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;

// User preferences (not used for MVP but kept for schema consistency)
export const users = {
  id: z.string(),
  username: z.string(),
  password: z.string(),
};

export type User = z.infer<typeof users.id> & z.infer<typeof users.username> & z.infer<typeof users.password>;
export type InsertUser = Omit<User, 'id'>;
