import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Minimize2, MoveIcon, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getAnonUsername } from '@/utils/anonNames';

interface ChatMessage {
  id: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: number;
  userId?: string;
  badges?: string[];
}

interface LiveChatProps {
  className?: string;
  overlay?: boolean;
  minimized?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  unreadCount?: number;
  onToggle?: () => void;
  onPositionChange?: (position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => void;
}

export default function LiveChat({
  className = '',
  overlay = false,
  minimized = false,
  position = 'bottom-right',
  unreadCount = 0,
  onToggle,
  onPositionChange
}: LiveChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Get username and avatar from auth or generate anonymous name
  const username = profile?.discord_username || user?.user_metadata?.full_name || getAnonUsername();
  const avatar = profile?.discord_avatar_url || user?.user_metadata?.avatar_url;
  const userId = user?.id || `anon-${Date.now()}`;

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/chat`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Chat] Connected');
        setIsConnected(true);

        // Join chat
        ws.send(JSON.stringify({
          type: 'join',
          userId,
          username,
          avatar
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'history') {
            setMessages(data.messages);
          } else if (data.type === 'message') {
            setMessages(prev => [...prev, data.message]);
          } else if (data.type === 'system') {
            // System messages (join/leave)
            setMessages(prev => [...prev, {
              id: `system-${Date.now()}`,
              username: 'SYSTEM',
              message: data.message,
              timestamp: data.timestamp
            }]);
          } else if (data.type === 'user_count') {
            setUserCount(data.count);
          }
        } catch (error) {
          console.error('[Chat] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[Chat] WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('[Chat] Disconnected');
        setIsConnected(false);

        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, username, avatar]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'message',
      message: inputMessage.trim()
    }));

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Minimized state - compact button with notification badge
  if (minimized) {
    return (
      <div className="relative" data-testid="chat-minimized">
        <Button
          onClick={onToggle}
          size="icon"
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg relative"
          data-testid="button-expand-chat"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1">
            <Badge
              variant="destructive"
              className="h-6 min-w-6 rounded-full flex items-center justify-center px-1.5 text-xs font-bold"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Expanded state - full chat interface
  return (
    <div
      className={`relative h-full ${overlay ? 'bg-background/95 backdrop-blur-md' : 'bg-card'} rounded-lg border border-border overflow-hidden shadow-xl ${className} flex flex-col`}
      data-testid="live-chat"
    >
      {/* Header */}
      <div className="bg-gradient-to-b from-background/95 to-transparent p-3 flex items-center gap-2 border-b border-border flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Live Chat</h3>

        {/* Connection indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground font-medium">
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* User count */}
        {userCount > 0 && (
          <div className="flex items-center gap-1 ml-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{userCount}</span>
          </div>
        )}

        {/* Controls */}
        <div className="ml-auto flex items-center gap-1">
          {/* Position Selector */}
          {onPositionChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  data-testid="button-position-menu"
                >
                  <MoveIcon className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-testid="dropdown-position">
                <DropdownMenuItem onClick={() => onPositionChange('top-left')}>Top Left</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPositionChange('top-right')}>Top Right</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPositionChange('bottom-left')}>Bottom Left</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPositionChange('bottom-right')}>Bottom Right</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Minimize Button */}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-7 w-7"
              data-testid="button-minimize-chat"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages - IRC Style */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-0.5 font-mono text-sm">
          {messages.length === 0 ? (
            <div className="text-center text-green-500/50 text-xs py-8">
              * No messages yet. Be the first to chat!
            </div>
          ) : (
            messages.map((msg) => {
              const isSystem = msg.username === 'SYSTEM';
              const isAnon = msg.username.match(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
              const usernameColor = isAnon ? 'text-green-500' : 'text-blue-400';
              const timestamp = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              });

              // System message (join/leave)
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex gap-1 leading-tight">
                    <span className="text-gray-500 text-xs flex-shrink-0">[{timestamp}]</span>
                    <span className="text-green-600 italic text-xs">{msg.message}</span>
                  </div>
                );
              }

              // Regular message
              return (
                <div key={msg.id} className="flex gap-1 leading-tight hover:bg-muted/30">
                  <span className="text-gray-500 text-xs flex-shrink-0">[{timestamp}]</span>
                  <span className={`font-bold flex-shrink-0 ${usernameColor}`}>&lt;{msg.username}&gt;</span>
                  <span className="text-foreground/90 break-words flex-1">{msg.message}</span>
                </div>
              );
            })
          )}
          <div ref={messageEndRef} />
        </div>
      </ScrollArea>

      {/* Input - IRC Style */}
      <div className="p-2 border-t border-border flex-shrink-0">
        <div className="flex gap-1 items-center font-mono">
          <span className="text-green-500 font-bold flex-shrink-0">&gt;</span>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isConnected ? "Type message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 font-mono text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
            maxLength={500}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !isConnected}
            size="icon"
            variant="ghost"
            className="h-7 w-7 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
