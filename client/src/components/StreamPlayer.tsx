import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type Player from 'video.js/dist/types/player';

interface StreamPlayerProps {
  streamKey: string;
  hlsPort?: number;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
}

export function StreamPlayer({ 
  streamKey, 
  hlsPort = 8888,
  autoplay = true,
  muted = true,
  controls = true,
  className = ''
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize Video.js player
    const player = videojs(videoRef.current, {
      autoplay,
      controls,
      muted,
      fluid: true,  // Responsive sizing
      responsive: true,
      liveui: true,  // Enable live UI
      liveTracker: {
        trackingThreshold: 0,
      },
      html5: {
        vhs: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          overrideNative: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
    });

    playerRef.current = player;

    // Construct HLS URL
    const hlsUrl = `http://${window.location.hostname}:${hlsPort}/live/${streamKey}/index.m3u8`;
    
    // Set source
    player.src({
      src: hlsUrl,
      type: 'application/x-mpegURL',
    });

    // Handle player events
    player.on('loadedmetadata', () => {
      console.log('[StreamPlayer] Stream loaded successfully');
      setIsLoading(false);
      setHasError(false);
    });

    player.on('error', (error) => {
      console.error('[StreamPlayer] Player error:', error);
      setIsLoading(false);
      setHasError(true);
    });

    player.on('waiting', () => {
      console.log('[StreamPlayer] Buffering...');
    });

    player.on('playing', () => {
      console.log('[StreamPlayer] Playing stream');
      setIsLoading(false);
      setHasError(false);
    });

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [streamKey, hlsPort, autoplay, controls, muted]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`} data-testid="stream-player-container">
      <div data-vjs-player className="w-full h-full">
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered vjs-theme-city"
          playsInline
          data-testid="video-element"
        />
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-bold mb-2">Stream Offline</h3>
            <p className="text-gray-400 text-sm mb-4">
              No active stream found.<br />
              Start streaming from OBS to begin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
