import { Badge } from "@/components/ui/badge";

interface LiveIndicatorProps {
  connected: boolean;
}

export function LiveIndicator({ connected }: LiveIndicatorProps) {
  return (
    <Badge 
      variant={connected ? "default" : "secondary"}
      className="gap-2 no-default-hover-elevate no-default-active-elevate"
      data-testid="badge-live-status"
    >
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-bullish animate-pulse' : 'bg-muted-foreground'}`} />
      {connected ? 'LIVE' : 'OFFLINE'}
    </Badge>
  );
}
