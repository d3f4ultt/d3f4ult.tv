import { useEffect, useRef, useState } from 'react';

interface StreamPlayerProps {
  streamKey: string;
  hlsPort?: number;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
}

interface PlaylistVideo {
  name: string;
  url: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);

  // Fetch playlist videos on mount
  useEffect(() => {
    console.log('[StreamPlayer] Fetching playlist...');
    fetch('/api/playlist/videos')
      .then(res => res.json())
      .then(videos => {
        console.log('[StreamPlayer] Loaded playlist videos:', videos);
        setPlaylistVideos(videos);
        if (videos.length > 0) {
          setIsPlayingPlaylist(true);
        }
      })
      .catch(err => {
        console.error('[StreamPlayer] Failed to load playlist:', err);
        setHasError(true);
      });
  }, []);

  // Play next video in playlist
  const playNextVideo = () => {
    if (playlistVideos.length === 0) return;
    setCurrentVideoIndex((prev) => (prev + 1) % playlistVideos.length);
  };

  // Update video source when playlist or index changes
  useEffect(() => {
    if (!videoRef.current || playlistVideos.length === 0) return;

    const video = playlistVideos[currentVideoIndex];
    console.log('[StreamPlayer] Loading video:', video.name, video.url);

    videoRef.current.src = video.url;
    videoRef.current.load();

    if (autoplay) {
      videoRef.current.play().catch(err => {
        console.error('[StreamPlayer] Autoplay failed:', err);
      });
    }
  }, [playlistVideos, currentVideoIndex, autoplay]);

  // Handle video events
  const handleLoadedData = () => {
    console.log('[StreamPlayer] Video loaded successfully');
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoEl = e.currentTarget;
    const error = videoEl.error;
    console.error('[StreamPlayer] Video error:', error?.code, error?.message);
    setIsLoading(false);
    setHasError(true);
  };

  const handleEnded = () => {
    console.log('[StreamPlayer] Video ended, playing next');
    playNextVideo();
  };

  const handlePlaying = () => {
    console.log('[StreamPlayer] Video playing');
    setIsLoading(false);
  };

  return (
    <div className={`relative w-full h-full bg-black ${className}`} data-testid="stream-player-container">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={controls}
        autoPlay={autoplay}
        muted={muted}
        playsInline
        onLoadedData={handleLoadedData}
        onError={handleError}
        onEnded={handleEnded}
        onPlaying={handlePlaying}
        data-testid="video-element"
      />

      {/* Loading overlay */}
      {isLoading && playlistVideos.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-sm">Loading video...</p>
          </div>
        </div>
      )}


      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-bold mb-2">Video Error</h3>
            <p className="text-gray-400 text-sm mb-4">
              Failed to load video. Check browser console for details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
