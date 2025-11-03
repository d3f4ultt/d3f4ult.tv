import NodeMediaServer from 'node-media-server';
import { log } from './vite';

// In-memory storage for stream keys (in production, use database)
const streamKeys = new Map<string, { userId: string; createdAt: Date; active: boolean }>();

// Generate a random stream key and persist it
export function generateStreamKey(): string {
  const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Persist the key to streamKeys map
  streamKeys.set(newKey, {
    userId: 'generated',
    createdAt: new Date(),
    active: true
  });
  
  return newKey;
}

// Validate stream key
export function validateStreamKey(key: string): boolean {
  const keyData = streamKeys.get(key);
  return keyData !== undefined && keyData.active;
}

// Get or create default stream key
export function getDefaultStreamKey(): string {
  const existingKey = Array.from(streamKeys.entries()).find(([_, data]) => data.userId === 'default');
  if (existingKey) {
    return existingKey[0];
  }
  
  const newKey = generateStreamKey();
  streamKeys.set(newKey, {
    userId: 'default',
    createdAt: new Date(),
    active: true
  });
  return newKey;
}

// Get all stream keys
export function getAllStreamKeys() {
  return Array.from(streamKeys.entries()).map(([key, data]) => ({
    key,
    ...data
  }));
}

// Deactivate stream key
export function deactivateStreamKey(key: string): boolean {
  const keyData = streamKeys.get(key);
  if (keyData) {
    keyData.active = false;
    return true;
  }
  return false;
}

// Node Media Server configuration
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,  // GOP (Group of Pictures) cache for faster stream startup
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8888,  // Different from main Express port (5000)
    mediaroot: './media',  // Where HLS files are stored
    allow_origin: '*'  // CORS for HLS playback
  },
  trans: {
    ffmpeg: '/nix/store/3zc5jbvqzrn8zmva4fx5p0nh4yy03wk4-ffmpeg-6.1.1-bin/bin/ffmpeg',  // FFmpeg path (Nix environment)
    tasks: [
      {
        app: 'live',  // RTMP app name
        hls: true,  // Enable HLS transcoding
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',  // Low latency HLS
        hlsKeep: true,  // Keep HLS files
        dash: false,  // Disable DASH
        mp4: false,  // Disable MP4 recording (can enable later)
      }
    ]
  },
  logType: 3,  // Log to console
  auth: {
    play: false,  // No authentication for playback
    publish: true,  // Require authentication for publishing
    secret: process.env.SESSION_SECRET || 'crypto-live-stream'
  }
};

let nms: NodeMediaServer | null = null;
let activeStreams = new Set<string>();

export function initMediaServer(): NodeMediaServer {
  if (nms) {
    return nms;
  }

  nms = new NodeMediaServer(config);

  // Authentication: Check stream key before allowing publish
  nms.on('prePublish', (id: string, streamPath: string, args: any) => {
    log(`[RTMP] Publish attempt - ID: ${id}, Path: ${streamPath}`);
    
    // Extract stream key from path: /live/{streamKey}
    const streamKey = streamPath.split('/').pop();
    
    if (!streamKey || !validateStreamKey(streamKey)) {
      log(`[RTMP] ❌ Invalid stream key: ${streamKey}`);
      const session = nms!.getSession(id);
      session.reject();
      return;
    }
    
    log(`[RTMP] ✅ Stream authorized: ${streamKey}`);
    activeStreams.add(streamKey);
  });

  // Handle successful publish
  nms.on('postPublish', (id: string, streamPath: string, args: any) => {
    const streamKey = streamPath.split('/').pop();
    log(`[RTMP] 🎥 Stream started: ${streamKey}`);
  });

  // Handle stream end
  nms.on('donePublish', (id: string, streamPath: string, args: any) => {
    const streamKey = streamPath.split('/').pop();
    if (streamKey) {
      activeStreams.delete(streamKey);
      log(`[RTMP] ⏹️ Stream ended: ${streamKey}`);
    }
  });

  // Handle play events
  nms.on('prePlay', (id: string, streamPath: string, args: any) => {
    const streamKey = streamPath.split('/').pop();
    log(`[RTMP] 👁️ Viewer connected: ${streamKey}`);
  });

  return nms;
}

export function startMediaServer(): void {
  // Check if RTMP streaming is disabled (for Replit or other restricted environments)
  const isReplit = process.env.REPL_ID !== undefined || process.env.REPLIT_DEPLOYMENT !== undefined;
  const rtmpDisabled = process.env.DISABLE_RTMP === 'true' || isReplit;
  
  if (rtmpDisabled) {
    log('[RTMP] ⚠️  RTMP streaming disabled (Replit environment detected)');
    log('[RTMP] 💡 RTMP streaming requires port 1935 which is not available on Replit');
    log('[RTMP] ✅ Deploy to your own VPS (d3f4ult.tv) to enable RTMP streaming');
    return;
  }
  
  try {
    const server = initMediaServer();
    server.run();
    log(`[RTMP] ✅ Media server started on port ${config.rtmp.port}`);
    log(`[HLS] ✅ HTTP server started on port ${config.http.port}`);
    log(`[RTMP] Stream to: rtmp://localhost:${config.rtmp.port}/live/{your-stream-key}`);
    log(`[HLS] Playback: http://localhost:${config.http.port}/live/{your-stream-key}/index.m3u8`);
  } catch (error: any) {
    log(`[RTMP] ❌ Failed to start media server: ${error.message}`);
    log('[RTMP] 💡 This feature requires a VPS with ports 1935 and 8888 available');
  }
}

export function isStreamActive(streamKey: string): boolean {
  return activeStreams.has(streamKey);
}

export function getActiveStreams(): string[] {
  return Array.from(activeStreams);
}

export function isMediaServerEnabled(): boolean {
  const isReplit = process.env.REPL_ID !== undefined || process.env.REPLIT_DEPLOYMENT !== undefined;
  return process.env.DISABLE_RTMP !== 'true' && !isReplit;
}

export function getMediaServerConfig() {
  return {
    rtmpPort: config.rtmp.port,
    hlsPort: config.http.port,
    defaultStreamKey: getDefaultStreamKey(),
    enabled: isMediaServerEnabled()
  };
}
