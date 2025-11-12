import { LayoutGrid, MonitorPlay, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LayoutMode } from "@shared/schema";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, isLoading: authLoading } = useAuth();

  const layouts: { mode: LayoutMode; icon: any; label: string }[] = [
    { mode: 'full-dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { mode: 'stream-sidebar', icon: MonitorPlay, label: 'Stream' },
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

      {!authLoading && (user ? <UserMenu /> : <LoginButton />)}
    </div>
  );
}
