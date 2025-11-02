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

        {/* RTMP Streaming Section */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default">NEW</Badge>
              Custom RTMP Streaming
            </CardTitle>
            <CardDescription>
              Stream directly to your dashboard via OBS (no third-party services needed)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">What is RTMP Streaming?</h3>
              <p className="text-sm text-muted-foreground">
                Instead of embedding external streams (like pump.fun), you can now stream your own content directly from OBS to the dashboard. 
                Your stream appears in the "Stream + Sidebar" layout with real-time crypto data alongside it.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">OBS Stream Settings</h3>
              
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="font-medium">Open OBS Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      File → Settings → Stream
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="font-medium">Select Custom Service</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Service: <span className="font-mono bg-muted px-2 py-0.5 rounded">Custom...</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Server: <span className="font-mono bg-muted px-2 py-0.5 rounded">rtmp://{window.location.hostname}:1935/live</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Stream Key: <span className="font-mono bg-muted px-2 py-0.5 rounded">(Get from dashboard sidebar)</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="font-medium">Configure Output Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Settings → Output → Streaming
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>Video Bitrate: <span className="font-medium">2500-4500 Kbps</span></li>
                      <li>Encoder: <span className="font-medium">x264 or hardware (NVENC/QuickSync)</span></li>
                      <li>Keyframe Interval: <span className="font-medium">2 seconds</span></li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="font-medium">Start Streaming</h4>
                    <p className="text-sm text-muted-foreground">
                      Click "Start Streaming" in OBS. Your stream will appear in the Stream + Sidebar layout automatically.
                      Switch to layout mode 2 or press the "2" key to view it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Important Notes
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-5">
                <li>Stream latency is typically 6-10 seconds (HLS protocol)</li>
                <li>Your stream key is shown in the dashboard sidebar when in "Stream + Sidebar" layout</li>
                <li>Port 1935 must be accessible (not blocked by firewall)</li>
                <li>Streams are automatically converted to HLS for browser playback</li>
              </ul>
            </div>
          </CardContent>
        </Card>

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
