import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { PriceTickerCard } from "@/components/PriceTickerCard";
import { NewsCard } from "@/components/NewsCard";
import { TweetCard } from "@/components/TweetCard";
import { TickerBar } from "@/components/TickerBar";
import { LayoutSwitcher } from "@/components/LayoutSwitcher";
import { LiveIndicator } from "@/components/LiveIndicator";
import { SettingsPanel } from "@/components/SettingsPanel";
import { LoadingState, PriceCardSkeleton, NewsCardSkeleton, TweetCardSkeleton } from "@/components/LoadingState";
import ChatEmbed from "@/components/ChatEmbed";
import { PumpFunWidget } from "@/components/PumpFunWidget";
import { WalletButton } from "@/components/WalletButton";
import { JupiterSwap } from "@/components/JupiterSwap";
import { StreamPlayer } from "@/components/StreamPlayer";
import { StreamControls } from "@/components/StreamControls";
import type { CryptoPrice, NewsArticle, Tweet, LayoutMode, WSMessage } from "@shared/schema";

export default function Dashboard() {
  // Check URL parameters for initial layout
  const urlParams = new URLSearchParams(window.location.search);
  const urlLayout = urlParams.get('layout') as LayoutMode | null;
  const validLayouts: LayoutMode[] = ['full-dashboard', 'stream-sidebar', 'video-overlay', 'ticker-only'];
  const isValidLayout = urlLayout && validLayouts.includes(urlLayout);
  const initialLayout: LayoutMode = isValidLayout ? urlLayout : 'full-dashboard';

  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [currentLayout, setCurrentLayout] = useState<LayoutMode>(initialLayout);
  const [autoSwitch, setAutoSwitch] = useState(!isValidLayout); // Only disable auto-switch if layout parameter is valid
  const [autoSwitchInterval, setAutoSwitchInterval] = useState(45); // Configurable interval in seconds
  const [nextSwitchIn, setNextSwitchIn] = useState(45);
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

  // Auto layout switching with configurable interval
  useEffect(() => {
    if (!autoSwitch) return;
    
    const layouts: LayoutMode[] = ['full-dashboard', 'stream-sidebar', 'video-overlay'];
    let currentIndex = layouts.indexOf(currentLayout);
    let countdown = autoSwitchInterval;
    
    const countdownInterval = setInterval(() => {
      countdown--;
      setNextSwitchIn(countdown);
      
      if (countdown === 0) {
        currentIndex = (currentIndex + 1) % layouts.length;
        setCurrentLayout(layouts[currentIndex]);
        countdown = autoSwitchInterval;
      }
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [autoSwitch, currentLayout, autoSwitchInterval]);

  // Reset countdown when interval changes
  useEffect(() => {
    setNextSwitchIn(autoSwitchInterval);
  }, [autoSwitchInterval]);

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

      const layouts: LayoutMode[] = ['full-dashboard', 'stream-sidebar', 'video-overlay'];
      
      switch (e.key) {
        case '1':
          setCurrentLayout('full-dashboard');
          // Clear any pending auto-resume timeout
          if (autoResumeTimeoutRef.current) {
            clearTimeout(autoResumeTimeoutRef.current);
          }
          // Pause auto-switch temporarily
          setAutoSwitch(false);
          // Auto-resume after 3 seconds
          autoResumeTimeoutRef.current = setTimeout(() => {
            setAutoSwitch(true);
            autoResumeTimeoutRef.current = null;
          }, 3000);
          break;
        case '2':
          setCurrentLayout('stream-sidebar');
          // Clear any pending auto-resume timeout
          if (autoResumeTimeoutRef.current) {
            clearTimeout(autoResumeTimeoutRef.current);
          }
          // Pause auto-switch temporarily
          setAutoSwitch(false);
          // Auto-resume after 3 seconds
          autoResumeTimeoutRef.current = setTimeout(() => {
            setAutoSwitch(true);
            autoResumeTimeoutRef.current = null;
          }, 3000);
          break;
        case '3':
          setCurrentLayout('video-overlay');
          // Clear any pending auto-resume timeout
          if (autoResumeTimeoutRef.current) {
            clearTimeout(autoResumeTimeoutRef.current);
          }
          // Pause auto-switch temporarily
          setAutoSwitch(false);
          // Auto-resume after 3 seconds
          autoResumeTimeoutRef.current = setTimeout(() => {
            setAutoSwitch(true);
            autoResumeTimeoutRef.current = null;
          }, 3000);
          break;
        case ' ':
          e.preventDefault(); // Prevent page scroll
          // Clear any pending auto-resume timeout (manual override)
          if (autoResumeTimeoutRef.current) {
            clearTimeout(autoResumeTimeoutRef.current);
            autoResumeTimeoutRef.current = null;
            // If there was a pending resume, keep auto-switch off (user wants manual control)
            setAutoSwitch(false);
          } else {
            // No pending resume, toggle normally
            setAutoSwitch(!autoSwitch);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [autoSwitch, settingsOpen]);

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

  const isLoading = pricesLoading && newsLoading && tweetsLoading;
  const hasErrors = pricesError || newsError || tweetsError;

  if (isLoading) {
    return <LoadingState message="Connecting to live market data..." />;
  }

  if (hasErrors && prices.length === 0 && news.length === 0 && tweets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Connection Issue</h2>
          <p className="text-muted-foreground mb-4">
            Having trouble connecting to data sources. Retrying automatically...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  // Full Dashboard Layout
  if (currentLayout === 'full-dashboard') {
    return (
      <div className="min-h-screen bg-background" data-testid="layout-full-dashboard">
        <LayoutSwitcher
          currentLayout={currentLayout}
          onLayoutChange={setCurrentLayout}
          autoSwitch={autoSwitch}
          onAutoSwitchToggle={() => setAutoSwitch(!autoSwitch)}
          nextSwitchIn={nextSwitchIn}
        />
        
        <TickerBar prices={prices} />
        
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Crypto Live</h1>
              <p className="text-muted-foreground">Real-time market dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <WalletButton />
              <JupiterSwap />
              <Link href="/obs-guide">
                <Button variant="outline" size="sm" data-testid="button-obs-guide">
                  <BookOpen className="w-4 h-4 mr-2" />
                  OBS Setup Guide
                </Button>
              </Link>
              <SettingsPanel 
                autoSwitchInterval={autoSwitchInterval}
                onIntervalChange={setAutoSwitchInterval}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
              />
              <LiveIndicator connected={wsConnected} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Crypto Prices */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xl font-bold mb-4">Live Prices</h2>
              {prices.length > 0 ? (
                prices.map((crypto) => (
                  <PriceTickerCard key={crypto.id} crypto={crypto} />
                ))
              ) : (
                <>
                  <PriceCardSkeleton />
                  <PriceCardSkeleton />
                </>
              )}
            </div>
            
            {/* Center: Breaking News */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xl font-bold mb-4">Breaking News</h2>
              {news.length > 0 ? (
                <div className="space-y-4">
                  {news.slice(currentNewsIndex, currentNewsIndex + 3).map((article, index) => (
                    <NewsCard 
                      key={article.id} 
                      article={article} 
                      isBreaking={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <NewsCardSkeleton />
                  <NewsCardSkeleton />
                </>
              )}
            </div>
            
            {/* Right: Twitter Feed */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-xl font-bold mb-4">Notable Voices</h2>
              {tweets.length > 0 ? (
                <div className="space-y-3">
                  {tweets.slice(currentTweetIndex, currentTweetIndex + 4).map((tweet) => (
                    <TweetCard key={tweet.id} tweet={tweet} />
                  ))}
                </div>
              ) : (
                <>
                  <TweetCardSkeleton />
                  <TweetCardSkeleton />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stream + Sidebar Layout
  if (currentLayout === 'stream-sidebar') {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden" data-testid="layout-stream-sidebar">
        <LayoutSwitcher
          currentLayout={currentLayout}
          onLayoutChange={setCurrentLayout}
          autoSwitch={autoSwitch}
          onAutoSwitchToggle={() => setAutoSwitch(!autoSwitch)}
          nextSwitchIn={nextSwitchIn}
        />
        
        <TickerBar prices={prices} />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main Stream Area - Custom RTMP Stream */}
          <div className="flex-1 bg-black border-r border-border relative">
            <StreamPlayer 
              streamKey={streamKey}
              hlsPort={streamConfig?.hlsPort || 8888}
              className="absolute inset-0"
            />

            {/* Floating Chat Overlay */}
            <div 
              className={`absolute pointer-events-auto ${
                chatPosition === 'bottom-right' ? 'bottom-6 right-6' :
                chatPosition === 'bottom-left' ? 'bottom-6 left-6' :
                chatPosition === 'top-right' ? 'top-6 right-6' :
                'top-6 left-6'
              } ${chatMinimized ? 'w-auto h-auto' : 'w-80 h-96'}`}
              data-testid="chat-overlay-container"
            >
              <ChatEmbed 
                overlay={true}
                minimized={chatMinimized}
                position={chatPosition}
                unreadCount={chatUnreadCount}
                onToggle={handleChatToggle}
                onPositionChange={handleChatPositionChange}
              />
            </div>
          </div>
          
          {/* Sidebar with Stream Controls */}
          <div className="w-96 bg-background border-l border-border overflow-y-auto">
            <div className="p-4 border-b border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Live Stream</h2>
                <SettingsPanel 
                  autoSwitchInterval={autoSwitchInterval}
                  onIntervalChange={setAutoSwitchInterval}
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                />
              </div>
              <div className="flex flex-col gap-2">
                <WalletButton />
                <JupiterSwap />
              </div>
            </div>
            <div className="p-4 space-y-4">
              <StreamControls />
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-3">Pump.fun Market</h3>
                <PumpFunWidget />
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
        <TickerBar prices={prices} />
      </div>
    );
  }

  // Video Overlay Layout (minimal, for OBS)
  return (
    <div className="h-screen relative bg-transparent" data-testid="layout-video-overlay">
      <LayoutSwitcher
        currentLayout={currentLayout}
        onLayoutChange={setCurrentLayout}
        autoSwitch={autoSwitch}
        onAutoSwitchToggle={() => setAutoSwitch(!autoSwitch)}
        nextSwitchIn={nextSwitchIn}
      />
      
      {/* Bottom Ticker */}
      <div className="absolute bottom-0 left-0 right-0">
        <TickerBar prices={prices} />
      </div>
      
      {/* Logo Watermark */}
      <div className="absolute top-6 left-6 bg-card/80 backdrop-blur-md border border-card-border rounded-lg p-4 shadow-xl">
        <h1 className="text-2xl font-bold">Crypto Live</h1>
        <LiveIndicator connected={wsConnected} />
      </div>
      
      {/* Breaking News Banner (if available) */}
      {news.length > 0 && (
        <div className="absolute top-6 right-6 max-w-md">
          <div className="bg-card/90 backdrop-blur-md border border-card-border rounded-lg p-4 shadow-xl">
            <NewsCard article={news[currentNewsIndex]} isBreaking />
          </div>
        </div>
      )}
    </div>
  );
}
