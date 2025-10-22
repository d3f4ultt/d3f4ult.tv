import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface ChatEmbedProps {
  className?: string;
}

export default function ChatEmbed({ className = '' }: ChatEmbedProps) {
  // Check for environment variable first, fallback to provided token
  const chatToken = import.meta.env.VITE_RESTREAM_CHAT_TOKEN || 'f953557c-d9d7-4624-aeff-cabb071dc028';
  const embedUrl = `https://chat.restream.io/embed?token=${chatToken}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative h-full bg-card rounded-lg border border-border overflow-hidden ${className}`}
      data-testid="chat-embed"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-background/95 to-transparent z-10 p-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Live Chat</h3>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">LIVE</span>
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
