import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="p-8 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
        <h2 className="text-xl font-semibold mb-2">Crypto Live</h2>
        <p className="text-muted-foreground">{message}</p>
      </Card>
    </div>
  );
}

export function PriceCardSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-16 mb-4" />
      <div className="h-10 bg-muted rounded w-32 mb-2" />
      <div className="h-6 bg-muted rounded w-24" />
    </Card>
  );
}

export function NewsCardSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-full mb-2" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </Card>
  );
}

export function TweetCardSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-muted rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-32 mb-2" />
          <div className="h-4 bg-muted rounded w-full mb-1" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    </Card>
  );
}
