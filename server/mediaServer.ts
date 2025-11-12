import NodeMediaServer from 'node-media-server';
import { log } from './vite';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

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
    ping_timeout: 60,
    ip: '0.0.0.0'  // Bind to all interfaces (IPv4)
  },
  http: {
    port: 8888,  // Different from main Express port (5000)
    mediaroot: './media',  // Where HLS files are stored
    allow_origin: '*',  // CORS for HLS playback
    ip: '0.0.0.0'  // Bind to all interfaces (IPv4)
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',  // FFmpeg path on VPS
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
  logType: 3  // Log to console
  // NOTE: Authentication is handled in prePublish event handler, not by node-media-server's built-in auth
};

let nms: NodeMediaServer | null = null;
let activeStreams = new Set<string>();
let ffmpegProcesses = new Map<string, ChildProcess>();

export function initMediaServer(): NodeMediaServer {
  if (nms) {
    return nms;
  }

  nms = new NodeMediaServer(config);

  // Authentication: Check stream key before allowing publish
  nms.on('prePublish', (session: any) => {
    try {
      // node-media-server passes a session object
      const sessionId = session.id || '';
      const streamPath = session.streamPath || '';

      log(`[RTMP] Publish attempt - ID: ${sessionId}, Path: ${streamPath}`);

      // If no path provided, reject
      if (!streamPath) {
        log(`[RTMP] ❌ No stream path provided`);
        session.reject();
        return;
      }

      // Extract stream key from path: /live/{streamKey}
      const streamKey = streamPath.split('/').pop();

      if (!streamKey || !validateStreamKey(streamKey)) {
        log(`[RTMP] ❌ Invalid stream key: ${streamKey}`);
        log(`[RTMP] 💡 Expected key: Get from https://d3f4ult.tv (Stream Settings)`);
        session.reject();
        return;
      }

      log(`[RTMP] ✅ Stream authorized: ${streamKey}`);
      activeStreams.add(streamKey);
    } catch (error: any) {
      log(`[RTMP] ❌ Error in prePublish handler: ${error.message}`);
      // Reject on error
      if (session && session.reject) {
        session.reject();
      }
    }
  });

  // Handle successful publish
  nms.on('postPublish', (session: any) => {
    try {
      const streamPath = session.streamPath || '';
      const streamKey = streamPath.split('/').pop();
      log(`[RTMP] 🎥 Stream started: ${streamKey}`);

      // Start FFmpeg transcoding manually
      startFFmpegTranscoding(streamKey);
    } catch (error: any) {
      log(`[RTMP] ❌ Error in postPublish handler: ${error.message}`);
    }
  });

  // Handle stream end
  nms.on('donePublish', (session: any) => {
    try {
      const streamPath = session.streamPath || '';
      const streamKey = streamPath.split('/').pop();
      if (streamKey) {
        activeStreams.delete(streamKey);
        stopFFmpegTranscoding(streamKey);
        log(`[RTMP] ⏹️ Stream ended: ${streamKey}`);
      }
    } catch (error: any) {
      log(`[RTMP] ❌ Error in donePublish handler: ${error.message}`);
    }
  });

  // Handle play events
  nms.on('prePlay', (session: any) => {
    try {
      const streamPath = session.streamPath || '';
      const streamKey = streamPath.split('/').pop();
      log(`[RTMP] 👁️ Viewer connected: ${streamKey}`);
    } catch (error: any) {
      log(`[RTMP] ❌ Error in prePlay handler: ${error.message}`);
    }
  });

  return nms;
}

// Manual FFmpeg transcoding functions
function startFFmpegTranscoding(streamKey: string) {
  try {
    const mediaRoot = path.resolve(process.cwd(), 'media');
    const hlsPath = path.join(mediaRoot, 'live', streamKey);

    // Create HLS directory
    if (!fs.existsSync(hlsPath)) {
      fs.mkdirSync(hlsPath, { recursive: true });
    }

    // FFmpeg command to transcode RTMP to HLS
    const ffmpegArgs = [
      '-i', `rtmp://127.0.0.1:1935/live/${streamKey}`,
      '-c:v', 'copy',  // Copy video codec (no re-encoding)
      '-c:a', 'aac',   // Transcode audio to AAC
      '-f', 'hls',
      '-hls_time', '2',
      '-hls_list_size', '3',
      '-hls_flags', 'delete_segments',
      path.join(hlsPath, 'index.m3u8')
    ];

    log(`[FFmpeg] Starting transcoding for stream: ${streamKey}`);
    log(`[FFmpeg] Output: ${hlsPath}/index.m3u8`);

    const ffmpegProcess = spawn('/usr/bin/ffmpeg', ffmpegArgs);

    ffmpegProcess.stdout?.on('data', (data) => {
      log(`[FFmpeg] ${data.toString().trim()}`);
    });

    ffmpegProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      if (message.includes('frame=') || message.includes('time=')) {
        // Skip verbose frame info
        return;
      }
      log(`[FFmpeg] ${message}`);
    });

    ffmpegProcess.on('close', (code) => {
      log(`[FFmpeg] Process exited with code ${code} for stream: ${streamKey}`);
      ffmpegProcesses.delete(streamKey);
    });

    ffmpegProcess.on('error', (error) => {
      log(`[FFmpeg] ❌ Error: ${error.message}`);
    });

    ffmpegProcesses.set(streamKey, ffmpegProcess);
    log(`[FFmpeg] ✅ Transcoding started for stream: ${streamKey}`);
  } catch (error: any) {
    log(`[FFmpeg] ❌ Failed to start transcoding: ${error.message}`);
  }
}

function stopFFmpegTranscoding(streamKey: string) {
  const ffmpegProcess = ffmpegProcesses.get(streamKey);
  if (ffmpegProcess) {
    log(`[FFmpeg] Stopping transcoding for stream: ${streamKey}`);
    ffmpegProcess.kill('SIGTERM');
    ffmpegProcesses.delete(streamKey);
  }
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
