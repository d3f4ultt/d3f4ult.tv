import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, RefreshCw, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamConfig {
  rtmpPort: number;
  hlsPort: number;
  defaultStreamKey: string;
  enabled: boolean;
}

interface StreamStatus {
  streamKey: string;
  active: boolean;
}

export function StreamControls() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Fetch stream configuration
  const { data: config, isLoading: configLoading } = useQuery<StreamConfig>({
    queryKey: ['/api/stream/config'],
    refetchInterval: false, // Only fetch once
  });

  // Fetch stream status with auto-refresh
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<StreamStatus>({
    queryKey: ['/api/stream/status'],
    refetchInterval: 5000, // Check status every 5 seconds
    enabled: !!config,
  });

  const handleCopyStreamKey = () => {
    if (!config?.defaultStreamKey) return;
    
    navigator.clipboard.writeText(config.defaultStreamKey);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Stream key copied to clipboard',
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRTMPUrl = () => {
    if (!config) return;
    
    const rtmpUrl = `rtmp://${window.location.hostname}:${config.rtmpPort}/live`;
    navigator.clipboard.writeText(rtmpUrl);
    toast({
      title: 'Copied!',
      description: 'RTMP URL copied to clipboard',
    });
  };

  if (configLoading || !config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Stream Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if RTMP is disabled (Replit environment)
  if (!config.enabled) {
    return (
      <Card data-testid="stream-controls">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Stream Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-500">⚠️ RTMP Streaming Unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">
              RTMP streaming requires ports 1935 and 8888 which are not available in this environment (Replit).
            </p>
          </div>
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-500">💡 How to Enable</p>
            <p className="text-xs text-muted-foreground mt-1">
              Deploy this code to your own VPS server (like d3f4ult.tv) to enable custom RTMP streaming.
            </p>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            In the meantime, the dashboard works perfectly for viewing crypto data, news, and tweets.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rtmpUrl = `rtmp://${window.location.hostname}:${config.rtmpPort}/live`;
  const isActive = status?.active || false;

  return (
    <Card data-testid="stream-controls">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Stream Settings</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => refetchStatus()}
            disabled={statusLoading}
            data-testid="button-refresh-status"
            className="h-7 w-7"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1" data-testid="stream-status-badge">
            <Radio className={`h-3 w-3 ${isActive ? 'animate-pulse' : ''}`} />
            {isActive ? 'LIVE' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* RTMP URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">RTMP Server</label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-xs truncate" data-testid="rtmp-url">
              {rtmpUrl}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyRTMPUrl}
              data-testid="button-copy-rtmp-url"
              className="shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Stream Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Stream Key</label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-xs truncate" data-testid="stream-key">
              {config.defaultStreamKey}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyStreamKey}
              data-testid="button-copy-stream-key"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Configure OBS with the RTMP server URL and stream key above, then start streaming.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
