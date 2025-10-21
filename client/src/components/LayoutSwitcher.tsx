import { LayoutGrid, MonitorPlay, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LayoutMode } from "@shared/schema";

interface LayoutSwitcherProps {
  currentLayout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
  autoSwitch: boolean;
  onAutoSwitchToggle: () => void;
  nextSwitchIn?: number;
}

export function LayoutSwitcher({ 
  currentLayout, 
  onLayoutChange, 
  autoSwitch, 
  onAutoSwitchToggle,
  nextSwitchIn 
}: LayoutSwitcherProps) {
  const layouts: { mode: LayoutMode; icon: any; label: string }[] = [
    { mode: 'full-dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { mode: 'stream-sidebar', icon: MonitorPlay, label: 'Stream' },
    { mode: 'video-overlay', icon: Video, label: 'Overlay' },
  ];
  
  return (
    <div 
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-card-border rounded-lg p-2 shadow-lg"
      data-testid="layout-switcher"
    >
      <div className="flex items-center gap-1">
        {layouts.map(({ mode, icon: Icon, label }) => (
          <Button
            key={mode}
            size="sm"
            variant={currentLayout === mode ? "default" : "ghost"}
            onClick={() => onLayoutChange(mode)}
            className="gap-2"
            data-testid={`button-layout-${mode}`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>
      
      <div className="w-px h-6 bg-border" />
      
      <Button
        size="sm"
        variant={autoSwitch ? "default" : "outline"}
        onClick={onAutoSwitchToggle}
        className="gap-2"
        data-testid="button-auto-switch"
      >
        <span className="hidden sm:inline">Auto</span>
        {autoSwitch && nextSwitchIn !== undefined && (
          <Badge 
            variant="secondary" 
            className="text-xs no-default-hover-elevate no-default-active-elevate"
          >
            {nextSwitchIn}s
          </Badge>
        )}
      </Button>
    </div>
  );
}
