import { useState } from "react";
import { Settings, Keyboard, BookOpen, Copy, Check, RefreshCw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from '@tanstack/react-query';
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

interface SettingsPanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsPanel({
  open: externalOpen,
  onOpenChange
}: SettingsPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Fetch stream configuration
  const { data: config, isLoading: configLoading } = useQuery<StreamConfig>({
    queryKey: ['/api/stream/config'],
    refetchInterval: false,
  });

  // Fetch stream status with auto-refresh
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<StreamStatus>({
    queryKey: ['/api/stream/status'],
    refetchInterval: 5000,
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

  const rtmpUrl = config ? `rtmp://${window.location.hostname}:${config.rtmpPort}/live` : '';
  const isActive = status?.active || false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-settings-open"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" data-testid="dialog-settings">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Stream configuration, keyboard shortcuts, and setup guides
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stream Settings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Stream Settings</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {config && config.enabled && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              <CardDescription>
                Configure OBS for streaming
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !config?.enabled ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-500">⚠️ RTMP Streaming Unavailable</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      RTMP streaming requires ports 1935 and 8888 which are not available in this environment.
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-500">💡 How to Enable</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deploy this code to your own VPS server to enable custom RTMP streaming.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
              </div>
              <CardDescription>
                Quick keys for common actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Toggle Settings</span>
                  <Badge variant="outline" data-testid="text-shortcut-s">
                    <kbd className="font-mono">S</kbd>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OBS Setup Guide */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">OBS Setup Guide</CardTitle>
              </div>
              <CardDescription>
                Learn how to integrate this dashboard with OBS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/obs-guide">
                <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Open Setup Guide
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
