import { ExternalLink, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  article: NewsArticle;
  isBreaking?: boolean;
}

export function NewsCard({ article, isBreaking }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  
  return (
    <Card 
      className="p-6 hover-elevate transition-all duration-300 animate-slide-up"
      data-testid={`card-news-${article.id}`}
    >
      {isBreaking && (
        <Badge 
          className="mb-3 bg-breaking text-breaking-foreground border-0 animate-pulse-glow"
          data-testid="badge-breaking"
        >
          BREAKING
        </Badge>
      )}
      
      <a 
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        data-testid={`link-news-${article.id}`}
      >
        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-3">
          {article.title}
        </h3>
      </a>
      
      <div className="flex items-center gap-2 flex-wrap mt-3">
        <Badge 
          variant="secondary" 
          className="text-xs no-default-hover-elevate no-default-active-elevate"
        >
          {article.source}
        </Badge>
        
        {article.currencies && article.currencies.slice(0, 3).map((currency) => (
          <Badge 
            key={currency.code}
            variant="outline"
            className="text-xs no-default-hover-elevate no-default-active-elevate"
          >
            {currency.code}
          </Badge>
        ))}
        
        <span className="text-xs text-muted-foreground ml-auto">
          {timeAgo}
        </span>
      </div>
      
      {article.votes && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-bullish" />
            <span className="text-muted-foreground">
              {article.votes.positive} positive
            </span>
          </div>
          {article.votes.important > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-warning">⭐</span>
              <span className="text-muted-foreground">
                {article.votes.important} important
              </span>
            </div>
          )}
        </div>
      )}
      
      <a 
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
      >
        Read more
        <ExternalLink className="w-3 h-3" />
      </a>
    </Card>
  );
}
