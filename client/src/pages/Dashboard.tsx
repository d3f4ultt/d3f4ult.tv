import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { LayoutGrid, MonitorPlay, Copy, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceTickerCard } from "@/components/PriceTickerCard";
import { NewsCard } from "@/components/NewsCard";
import { TweetCard } from "@/components/TweetCard";
import { TickerBar } from "@/components/TickerBar";
import { LiveIndicator } from "@/components/LiveIndicator";
import { SettingsPanel } from "@/components/SettingsPanel";
import { LoadingState, PriceCardSkeleton, NewsCardSkeleton, TweetCardSkeleton } from "@/components/LoadingState";
import LiveChat from "@/components/LiveChat";
import { PumpFunWidget } from "@/components/PumpFunWidget";
import { JupiterSwap } from "@/components/JupiterSwap";
import { StreamPlayer } from "@/components/StreamPlayer";
import { PortfolioWidget } from "@/components/portfolio/PortfolioWidget";
import { PortfolioDialog } from "@/components/portfolio/PortfolioDialog";
import { SwapWidget } from "@/components/SwapWidget";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import type { CryptoPrice, NewsArticle, Tweet, LayoutMode, WSMessage } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();

  // Check URL parameters for initial layout
  const urlParams = new URLSearchParams(window.location.search);
  const urlLayout = urlParams.get('layout') as LayoutMode | null;
  const validLayouts: LayoutMode[] = ['full-dashboard', 'ticker-only'];
  const isValidLayout = urlLayout && validLayouts.includes(urlLayout);
  const initialLayout: LayoutMode = isValidLayout ? urlLayout : 'full-dashboard';

  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [currentLayout, setCurrentLayout] = useState<LayoutMode>(initialLayout);
  const [streamExpanded, setStreamExpanded] = useState(false); // Toggle between large/small stream
  const [wsConnected, setWsConnected] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [currentTweetIndex, setCurrentTweetIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false); // Track settings dialog state
  const [chatMinimized, setChatMinimized] = useState(false); // Chat minimized state
  const [chatPosition, setChatPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right'); // Chat position
  const [chatUnreadCount, setChatUnreadCount] = useState(0); // Unread message count
  const [streamKey, setStreamKey] = useState<string>('defaultStreamKey'); // Current stream key
  const wsRef = useRef<WebSocket | null>(null);
  const autoResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track auto-resume timeout
  const chatNotificationIntervalRef = useRef<NodeJS.Timeout | null>(null); // Track notification interval

  // Initial data fetch with proper error handling
  const { data: pricesData, isLoading: pricesLoading, error: pricesError } = useQuery<CryptoPrice[]>({
    queryKey: ['/api/crypto/prices'],
    refetchInterval: 30000,
    retry: 3,
  });

  const { data: newsData, isLoading: newsLoading, error: newsError } = useQuery<NewsArticle[]>({
    queryKey: ['/api/news'],
    refetchInterval: 60000,
    retry: 3,
  });

  const { data: tweetsData, isLoading: tweetsLoading, error: tweetsError } = useQuery<Tweet[]>({
    queryKey: ['/api/tweets'],
    refetchInterval: 60000,
    retry: 3,
  });

  // Fetch stream configuration
  const { data: streamConfig } = useQuery<{ rtmpPort: number; hlsPort: number; defaultStreamKey: string }>({
    queryKey: ['/api/stream/config'],
    refetchInterval: false,
  });

  // Update state when data changes - with proper synchronization
  useEffect(() => {
    if (pricesData !== undefined) {
      setPrices(pricesData);
    }
  }, [pricesData]);

  useEffect(() => {
    if (streamConfig?.defaultStreamKey) {
      setStreamKey(streamConfig.defaultStreamKey);
    }
  }, [streamConfig]);

  useEffect(() => {
    if (newsData !== undefined) {
      setNews(newsData);
    }
  }, [newsData]);

  useEffect(() => {
    if (tweetsData !== undefined) {
      setTweets(tweetsData);
    }
  }, [tweetsData]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          if (message.type === 'price_update') {
            setPrices(message.data);
          } else if (message.type === 'news_update') {
            setNews(message.data);
          } else if (message.type === 'tweet_update') {
            setTweets(message.data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);


  // News rotation
  useEffect(() => {
    if (news.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, 10000); // 10 seconds per news item
    
    return () => clearInterval(interval);
  }, [news.length]);

  // Tweet rotation
  useEffect(() => {
    if (tweets.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentTweetIndex((prev) => (prev + 1) % tweets.length);
    }, 8000); // 8 seconds per tweet
    
    return () => clearInterval(interval);
  }, [tweets.length]);

  // Keyboard shortcuts (only active when settings dialog is closed)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if settings dialog is open
      if (settingsOpen) {
        return;
      }

      // Ignore if user is typing in an input or other interactive element
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 's':
          // Toggle settings
          setSettingsOpen(!settingsOpen);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [settingsOpen]);

  // Simulate notifications when chat is minimized
  useEffect(() => {
    if (chatMinimized) {
      // Simulate new messages arriving every 8-15 seconds
      const interval = setInterval(() => {
        setChatUnreadCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      }, Math.random() * 7000 + 8000);
      
      chatNotificationIntervalRef.current = interval;
      
      return () => {
        if (chatNotificationIntervalRef.current) {
          clearInterval(chatNotificationIntervalRef.current);
        }
      };
    } else {
      // Reset unread count when chat is expanded
      setChatUnreadCount(0);
      if (chatNotificationIntervalRef.current) {
        clearInterval(chatNotificationIntervalRef.current);
      }
    }
  }, [chatMinimized]);

  // Handler functions for chat controls
  const handleChatToggle = () => {
    setChatMinimized(!chatMinimized);
  };

  const handleChatPositionChange = (position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => {
    setChatPosition(position);
  };

  // Combined Dashboard + Stream Layout
  if (currentLayout === 'full-dashboard') {
    // Large Stream View (Full Screen Mode)
    if (streamExpanded) {
      return (
        <div className="h-screen bg-background flex flex-col overflow-hidden" data-testid="layout-stream-expanded">
          <TickerBar
            prices={prices}
            settingsOpen={settingsOpen}
            onSettingsOpenChange={setSettingsOpen}
            wsConnected={wsConnected}
          />

          {/* Dashboard Toggle Button */}
          <div className="fixed top-4 right-4 z-50 bg-card/95 backdrop-blur-sm border border-card-border rounded-lg p-2 shadow-lg">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStreamExpanded(false)}
              className="gap-2"
              data-testid="button-collapse-stream"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Main Stream Area */}
            <div className="flex-1 bg-black border-r border-border relative">
              <StreamPlayer
                streamKey={streamKey}
                hlsPort={streamConfig?.hlsPort || 8888}
                className="absolute inset-0"
              />
            </div>

            {/* Sidebar */}
            <div className="w-96 bg-background border-l border-border overflow-y-auto">
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Pump.fun Market</h3>
                  <PumpFunWidget />
                </div>

                {/* Live Chat Section */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Live Chat</h3>
                  <div className="h-96">
                    <LiveChat
                      overlay={false}
                      minimized={false}
                      position="bottom-right"
                      unreadCount={0}
                      onToggle={() => {}}
                      onPositionChange={() => {}}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Small Stream Widget View (Dashboard Mode)
    return (
      <div className="min-h-screen bg-background relative" data-testid="layout-full-dashboard">
        <TickerBar
          prices={prices}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={setSettingsOpen}
          wsConnected={wsConnected}
        />

        {/* Floating Chat Overlay */}
        <div
          className={`fixed z-40 ${
            chatPosition === 'bottom-right' ? 'bottom-6 right-6' :
            chatPosition === 'bottom-left' ? 'bottom-6 left-6' :
            chatPosition === 'top-right' ? 'top-20 right-6' :
            'top-20 left-6'
          } ${chatMinimized ? 'w-auto h-auto' : 'w-80 h-96'}`}
          data-testid="chat-overlay-container"
          style={{ pointerEvents: 'auto' }}
        >
          <LiveChat
            overlay={true}
            minimized={chatMinimized}
            position={chatPosition}
            unreadCount={chatUnreadCount}
            onToggle={handleChatToggle}
            onPositionChange={handleChatPositionChange}
          />
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Portfolio Widget */}
          <div className="mb-6">
            <PortfolioWidget />
          </div>

          {/* Copy Trading Banner */}
          <div className="mb-6">
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/10 to-background">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Copy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Copy Trading</CardTitle>
                      <CardDescription>
                        Automatically mirror top traders' strategies
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/copy-trading">
                    <Button size="lg" className="gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Start Copy Trading
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-primary">5</span>
                    <span className="text-sm text-muted-foreground">Top Traders</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-green-500">+45.8%</span>
                    <span className="text-sm text-muted-foreground">Best ROI</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-blue-500">1,234</span>
                    <span className="text-sm text-muted-foreground">Active Copiers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Live Stream (Small Widget) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Live Stream</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStreamExpanded(true)}
                  data-testid="button-expand-stream"
                >
                  <MonitorPlay className="w-4 h-4 mr-2" />
                  Expand
                </Button>
              </div>
              <div className="relative bg-black rounded-lg overflow-hidden border border-border" style={{ aspectRatio: '16/9' }}>
                <StreamPlayer
                  streamKey={streamKey}
                  hlsPort={streamConfig?.hlsPort || 8888}
                  className="absolute inset-0"
                />
              </div>
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-3">Pump.fun Market</h3>
                <PumpFunWidget />
              </div>
            </div>

            {/* Center: Crypto Prices */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold mb-4">Live Prices</h2>
              {pricesLoading ? (
                <><PriceCardSkeleton /><PriceCardSkeleton /></>
              ) : pricesError ? (
                <div className="text-red-500">Error loading prices.</div>
              ) : prices.length > 0 ? (
                prices.map((crypto) => (
                  <PriceTickerCard key={crypto.id} crypto={crypto} />
                ))
              ) : (
                <div className="text-muted-foreground">No price data available.</div>
              )}
            </div>

            {/* Right: Breaking News & Tweets */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Breaking News</h2>
                {newsLoading ? (
                  <><NewsCardSkeleton /><NewsCardSkeleton /></>
                ) : newsError ? (
                  <div className="text-red-500">Error loading news.</div>
                ) : news.length > 0 ? (
                  <div className="space-y-4">
                    {news.slice(currentNewsIndex, currentNewsIndex + 2).map((article, index) => (
                      <NewsCard
                        key={article.id}
                        article={article}
                        isBreaking={index === 0}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">No news available.</div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Notable Voices</h2>
                {tweetsLoading ? (
                  <><TweetCardSkeleton /><TweetCardSkeleton /></>
                ) : tweetsError ? (
                  <div className="text-red-500">Error loading tweets.</div>
                ) : tweets.length > 0 ? (
                  <div className="space-y-3">
                    {tweets.slice(currentTweetIndex, currentTweetIndex + 3).map((tweet) => (
                      <TweetCard key={tweet.id} tweet={tweet} />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">No tweets available.</div>
                )}
              </div>

              {/* Swap Widget */}
              <div>
                <SwapWidget />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Ticker Only Layout (just the ticker bar for lower-third overlays)
  if (currentLayout === 'ticker-only') {
    return (
      <div className="h-full bg-transparent" data-testid="layout-ticker-only">
        <TickerBar
          prices={prices}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={setSettingsOpen}
          wsConnected={wsConnected}
        />
      </div>
    );
  }

  // Default to full-dashboard if no layout matches
  return null;
}
