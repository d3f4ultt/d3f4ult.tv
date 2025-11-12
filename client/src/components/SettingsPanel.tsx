import { useState } from "react";
import { Settings, Keyboard, Clock, BookOpen, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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

interface SettingsPanelProps {
  autoSwitchInterval: number;
  onIntervalChange: (interval: number) => void;
  autoSwitch: boolean;
  onAutoSwitchToggle: () => void;
  nextSwitchIn?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsPanel({
  autoSwitchInterval,
  onIntervalChange,
  autoSwitch,
  onAutoSwitchToggle,
  nextSwitchIn,
  open: externalOpen,
  onOpenChange
}: SettingsPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleIntervalChange = (value: number[]) => {
    onIntervalChange(value[0]);
  };

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

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
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-settings">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Customize auto-switching timing and keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Auto-Switch Settings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Auto-Switch Layouts</CardTitle>
              </div>
              <CardDescription>
                Automatically cycle between layouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Auto-Switch Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-switch">Enable Auto-Switch</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically rotate through layouts
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {autoSwitch && nextSwitchIn !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {nextSwitchIn}s
                    </Badge>
                  )}
                  <Switch
                    id="auto-switch"
                    checked={autoSwitch}
                    onCheckedChange={onAutoSwitchToggle}
                    data-testid="switch-auto-switch"
                  />
                </div>
              </div>

              {/* Interval Slider (only show when enabled) */}
              {autoSwitch && (
                <>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Switch Interval</Label>
                      <Badge variant="secondary" data-testid="text-interval-value">
                        {formatInterval(autoSwitchInterval)}
                      </Badge>
                    </div>
                    <Slider
                      min={10}
                      max={120}
                      step={5}
                      value={[autoSwitchInterval]}
                      onValueChange={handleIntervalChange}
                      data-testid="slider-interval"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>10s</span>
                      <span>2m</span>
                    </div>
                  </div>
                </>
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
                Quick keys for instant layout switching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Full Dashboard</span>
                  <Badge variant="outline" data-testid="text-shortcut-1">
                    <kbd className="font-mono">1</kbd>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stream + Sidebar</span>
                  <Badge variant="outline" data-testid="text-shortcut-2">
                    <kbd className="font-mono">2</kbd>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Toggle Auto-Switch</span>
                  <Badge variant="outline" data-testid="text-shortcut-space">
                    <kbd className="font-mono">Space</kbd>
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
