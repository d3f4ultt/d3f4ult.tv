import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Minimize2, Maximize2, MoveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ChatEmbedProps {
  className?: string;
  overlay?: boolean;
  minimized?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  unreadCount?: number;
  onToggle?: () => void;
  onPositionChange?: (position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => void;
}

export default function ChatEmbed({ 
  className = '', 
  overlay = false,
  minimized = false,
  position = 'bottom-right',
  unreadCount = 0,
  onToggle,
  onPositionChange
}: ChatEmbedProps) {
  // Check for environment variable first, fallback to provided token
  const chatToken = import.meta.env.VITE_RESTREAM_CHAT_TOKEN || 'f953557c-d9d7-4624-aeff-cabb071dc028';
  const embedUrl = `https://chat.restream.io/embed?token=${chatToken}`;

  // Minimized state - compact button with notification badge
  if (minimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative"
        data-testid="chat-embed-minimized"
      >
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1"
          >
            <Badge 
              variant="destructive" 
              className="h-6 min-w-6 rounded-full flex items-center justify-center px-1.5 text-xs font-bold"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Expanded state - full chat interface
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative h-full ${overlay ? 'bg-background/80 backdrop-blur-md' : 'bg-card'} rounded-lg border border-border overflow-hidden shadow-xl ${className}`}
      data-testid="chat-embed"
    >
      {/* Header with Controls */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-background/95 to-transparent z-10 p-2 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Live Chat</h3>
        
        {/* LIVE indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">LIVE</span>
        </div>
        
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
                <DropdownMenuItem 
                  onClick={() => onPositionChange('top-left')}
                  data-testid="position-top-left"
                >
                  Top Left
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onPositionChange('top-right')}
                  data-testid="position-top-right"
                >
                  Top Right
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onPositionChange('bottom-left')}
                  data-testid="position-bottom-left"
                >
                  Bottom Left
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onPositionChange('bottom-right')}
                  data-testid="position-bottom-right"
                >
                  Bottom Right
                </DropdownMenuItem>
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

      {/* Chat iframe */}
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        allow="autoplay; encrypted-media"
        title="Restream Chat"
        data-testid="chat-iframe"
      />
    </motion.div>
  );
}
