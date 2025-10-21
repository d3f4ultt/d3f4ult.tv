import { MessageCircle, Repeat2, Heart, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Tweet } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface TweetCardProps {
  tweet: Tweet;
}

export function TweetCard({ tweet }: TweetCardProps) {
  const timeAgo = formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true });
  const tweetUrl = `https://twitter.com/${tweet.author_username}/status/${tweet.id}`;
  
  return (
    <Card 
      className="p-4 hover-elevate transition-all duration-300 animate-slide-up"
      data-testid={`card-tweet-${tweet.id}`}
    >
      <div className="flex gap-3">
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage 
            src={tweet.author_profile_image} 
            alt={tweet.author_name}
          />
          <AvatarFallback>
            {tweet.author_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className="font-semibold text-sm truncate"
                  data-testid={`text-author-${tweet.id}`}
                >
                  {tweet.author_name}
                </span>
                {tweet.author_verified && (
                  <Badge 
                    className="bg-primary text-primary-foreground text-xs px-1 py-0 h-4 no-default-hover-elevate no-default-active-elevate"
                  >
                    ✓
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                @{tweet.author_username} · {timeAgo}
              </div>
            </div>
          </div>
          
          <p 
            className="text-sm mb-3 whitespace-pre-wrap break-words"
            data-testid={`text-content-${tweet.id}`}
          >
            {tweet.text}
          </p>
          
          {tweet.public_metrics && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{tweet.public_metrics.reply_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Repeat2 className="w-3.5 h-3.5" />
                <span>{tweet.public_metrics.retweet_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                <span>{tweet.public_metrics.like_count}</span>
              </div>
              <a 
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
                data-testid={`link-tweet-${tweet.id}`}
              >
                View on X
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
