import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Copy, Check, Download, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function OBSGuide() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  const baseUrl = window.location.origin;
  
  const presets = [
    {
      name: "Full Dashboard",
      layout: "full-dashboard",
      width: 1920,
      height: 1080,
      description: "Complete broadcast view with all data sources",
      use: "Main scene, full-screen overlays"
    },
    {
      name: "Stream Sidebar",
      layout: "stream-sidebar",
      width: 1920,
      height: 1080,
      description: "Sidebar layout for dual-pane streaming",
      use: "Side-by-side with gameplay/content"
    },
    {
      name: "Video Overlay",
      layout: "video-overlay",
      width: 1920,
      height: 1080,
      description: "Minimal ticker and logo overlay",
      use: "Bottom overlay on main content"
    },
    {
      name: "Ticker Only (1080p)",
      layout: "ticker-only",
      width: 1920,
      height: 150,
      description: "Just the bottom ticker bar",
      use: "Lower third overlay"
    }
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">OBS Browser Source Setup</h1>
          <p className="text-xl text-muted-foreground">
            Professional streaming integration for your crypto dashboard
          </p>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Get your crypto dashboard live in OBS in 3 easy steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Add Browser Source</h3>
                  <p className="text-muted-foreground">
                    In OBS, click the + icon under Sources → Select "Browser"
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Configure URL & Resolution</h3>
                  <p className="text-muted-foreground">
                    Paste your dashboard URL and set the recommended resolution from presets below
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                  3
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Apply Settings</h3>
                  <p className="text-muted-foreground">
                    Enable "Shutdown source when not visible" and "Refresh browser when scene becomes active"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Presets */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Streaming Presets</h2>
            <p className="text-muted-foreground">
              Pre-configured layouts optimized for different streaming scenarios
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {presets.map((preset) => {
              const url = `${baseUrl}/?layout=${preset.layout}`;
              const presetId = `preset-${preset.layout}`;
              
              return (
                <Card key={preset.name} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle>{preset.name}</CardTitle>
                        <CardDescription>{preset.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {preset.width}×{preset.height}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Best for:</p>
                      <p className="text-sm text-muted-foreground">{preset.use}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Browser Source URL:</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(url, presetId)}
                          data-testid={`button-copy-${preset.layout}`}
                        >
                          {copiedUrl === presetId ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy URL
                            </>
                          )}
                        </Button>
                      </div>
                      <code className="block p-3 bg-muted rounded text-xs break-all font-mono">
                        {url}
                      </code>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                      <div>
                        <p className="text-muted-foreground">Width</p>
                        <p className="font-medium">{preset.width}px</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Height</p>
                        <p className="font-medium">{preset.height}px</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced OBS Settings</CardTitle>
            <CardDescription>
              Recommended configuration for optimal performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="browser" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="browser" data-testid="tab-browser-source">Browser Source</TabsTrigger>
                <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
                <TabsTrigger value="tips" data-testid="tab-tips">Pro Tips</TabsTrigger>
              </TabsList>

              <TabsContent value="browser" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Shutdown source when not visible</p>
                      <p className="text-sm text-muted-foreground">
                        ✅ Enable - Saves CPU/GPU resources when scene is inactive
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Refresh browser when scene becomes active</p>
                      <p className="text-sm text-muted-foreground">
                        ✅ Enable - Ensures fresh data when switching scenes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Custom CSS (Optional)</p>
                      <p className="text-sm text-muted-foreground">
                        Leave blank - Dashboard already styled for streaming
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">FPS</p>
                      <p className="text-sm text-muted-foreground">
                        Set to 30 FPS - Perfect balance for smooth animations
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Hardware Acceleration</p>
                      <p className="text-sm text-muted-foreground">
                        Enable in OBS Settings → Advanced → Browser Source Hardware Acceleration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Multiple Browser Sources</p>
                      <p className="text-sm text-muted-foreground">
                        Each browser source uses system resources - use sparingly
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">CPU Usage</p>
                      <p className="text-sm text-muted-foreground">
                        Dashboard uses ~2-5% CPU when visible (tested on mid-range systems)
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tips" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Chroma Key Not Needed</p>
                      <p className="text-sm text-muted-foreground">
                        Dashboard has transparent backgrounds in overlay mode
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">URL Parameters</p>
                      <p className="text-sm text-muted-foreground">
                        Add ?layout=video-overlay to force a specific layout mode
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Scene Transitions</p>
                      <p className="text-sm text-muted-foreground">
                        Use fade transitions (200-300ms) for professional look
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Testing</p>
                      <p className="text-sm text-muted-foreground">
                        Always preview in OBS before going live to check positioning
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-1">Browser source shows blank/white screen</p>
                <p className="text-sm text-muted-foreground">
                  → Check the URL is correct and includes https:// protocol<br />
                  → Enable "Refresh browser when scene becomes active"<br />
                  → Try right-clicking source → Interact → Refresh page
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">Data not updating in OBS</p>
                <p className="text-sm text-muted-foreground">
                  → WebSocket connection may be blocked - check firewall<br />
                  → Refresh the browser source<br />
                  → Verify dashboard works in regular browser first
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">Performance issues / lag</p>
                <p className="text-sm text-muted-foreground">
                  → Enable hardware acceleration in OBS Advanced settings<br />
                  → Reduce FPS to 24-30 for browser source<br />
                  → Close unnecessary browser sources when not in use
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.location.href = '/'}
            data-testid="button-back-dashboard"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
