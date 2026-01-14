
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { IPTVChannel, StreamHealth } from '../types';
import { StorageService } from '../services/storageService';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward, 
  Loader2, 
  Star, 
  Tv, 
  PictureInPicture2,
  Settings,
  Minimize2,
  RotateCcw,
  Gauge,
  Headphones,
  Monitor,
  MessageSquare
} from 'lucide-react';

interface VideoPlayerProps {
  channel: IPTVChannel | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onMinimize?: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITY_OPTIONS = ['auto', '1080p', '720p', '480p', '360p'];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  channel, 
  isFavorite, 
  onToggleFavorite, 
  onNext, 
  onPrevious,
  onMinimize 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const watchStartTime = useRef<number>(0);
  
  // Basic player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  
  // Enhanced features state
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>(['auto']);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [streamHealth, setStreamHealth] = useState<StreamHealth | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [bandwidthUsage, setBandwidthUsage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenMessage, setShowFullscreenMessage] = useState(false);
  const fullscreenMessageTimerRef = useRef<number | null>(null);
  
  const controlsTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsPiPSupported(
      typeof document !== 'undefined' && 
      'pictureInPictureEnabled' in document && 
      (document as any).pictureInPictureEnabled
    );

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      if (isNowFullscreen) {
        // Show fullscreen message when entering fullscreen
        setShowFullscreenMessage(true);
        
        // Clear any existing timer
        if (fullscreenMessageTimerRef.current) {
          window.clearTimeout(fullscreenMessageTimerRef.current);
        }
        
        // Hide message after 5 seconds
        fullscreenMessageTimerRef.current = window.setTimeout(() => {
          setShowFullscreenMessage(false);
        }, 5000);
      } else {
        // Hide message immediately when exiting fullscreen
        setShowFullscreenMessage(false);
        if (fullscreenMessageTimerRef.current) {
          window.clearTimeout(fullscreenMessageTimerRef.current);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      // Clear fullscreen message timer
      if (fullscreenMessageTimerRef.current) {
        window.clearTimeout(fullscreenMessageTimerRef.current);
      }
    };
  }, []);

  // Track watch time for analytics - Enhanced to always save
  const trackWatchTime = useCallback(() => {
    if (!channel || !watchStartTime.current) return;
    
    const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
    if (watchDuration > 2) { // Reduced threshold to 2 seconds for better tracking
      StorageService.addToWatchHistory({
        channelId: channel.id,
        channelName: channel.name,
        timestamp: Date.now(),
        duration: watchDuration,
        logo: channel.logo || undefined
      });
      console.log(`Tracked watch time: ${watchDuration}s for ${channel.name}`); // Debug log
    }
  }, [channel]);

  // Auto-save watch time periodically
  useEffect(() => {
    if (!channel || !isPlaying) return;

    const interval = setInterval(() => {
      trackWatchTime();
      // Reset start time for next interval
      watchStartTime.current = Date.now();
    }, 30000); // Save every 30 seconds while playing

    return () => clearInterval(interval);
  }, [channel, isPlaying, trackWatchTime]);

  // Monitor stream health
  const updateStreamHealth = useCallback((status: 'healthy' | 'slow' | 'failed', latency: number = 0) => {
    if (!channel) return;
    
    const health: StreamHealth = {
      channelId: channel.id,
      status,
      latency,
      lastChecked: Date.now()
    };
    
    setStreamHealth(health);
    StorageService.updateStreamHealth(health);
  }, [channel]);

  // Auto-retry failed streams
  const retryStream = useCallback(() => {
    if (!channel || retryCount >= 3) return;
    
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);
    
    // Retry after delay
    setTimeout(() => {
      if (videoRef.current && channel) {
        const video = videoRef.current;
        
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsRef.current = hls;
          hls.loadSource(channel.url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => setIsPlaying(false));
            setIsLoading(false);
            updateStreamHealth('healthy');
            setRetryCount(0);
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              updateStreamHealth('failed');
              setError('Stream unavailable. Retrying...');
              setTimeout(retryStream, 2000);
            }
          });
        }
      }
    }, 1000 * retryCount);
  }, [channel, retryCount, updateStreamHealth]);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 4000);
    
    // Also show fullscreen message briefly if in fullscreen mode
    if (isFullscreen && !showFullscreenMessage) {
      setShowFullscreenMessage(true);
      if (fullscreenMessageTimerRef.current) {
        window.clearTimeout(fullscreenMessageTimerRef.current);
      }
      fullscreenMessageTimerRef.current = window.setTimeout(() => {
        setShowFullscreenMessage(false);
      }, 3000); // Show for 3 seconds on mouse movement
    }
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    // Track watch start time
    watchStartTime.current = Date.now();
    
    let hls: Hls | null = null;
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setIsPlaying(false));
        setIsLoading(false);
        updateStreamHealth('healthy');
        
        // Get available qualities
        const levels = hls.levels.map(level => `${level.height}p`);
        setAvailableQualities(['auto', ...levels]);
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          updateStreamHealth('failed');
          setError('Stream unavailable. Please try another channel.');
          setIsLoading(false);
          
          // Auto-retry after 3 seconds
          setTimeout(retryStream, 3000);
        }
      });

      // Track bandwidth usage
      hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        const bytes = data.frag.stats.total;
        setBandwidthUsage(prev => prev + bytes);
        StorageService.addBandwidthUsage(bytes);
      });

      // Get audio tracks
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        setAudioTracks(hls.audioTracks);
      });
      
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      const onLoaded = () => {
        video.play().catch(() => {});
        setIsLoading(false);
        updateStreamHealth('healthy');
      };
      video.addEventListener('loadedmetadata', onLoaded);
      return () => video.removeEventListener('loadedmetadata', onLoaded);
    }

    return () => { 
      trackWatchTime();
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, trackWatchTime, updateStreamHealth, retryStream]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        trackWatchTime(); // Save watch time when pausing
      } else {
        videoRef.current.play().catch(() => {});
        // Reset watch start time when resuming
        watchStartTime.current = Date.now();
      }
      setIsPlaying(!isPlaying);
      resetControlsTimer();
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const changeQuality = (quality: string) => {
    if (!hlsRef.current) return;
    
    setSelectedQuality(quality);
    
    if (quality === 'auto') {
      hlsRef.current.currentLevel = -1;
    } else {
      const levelIndex = hlsRef.current.levels.findIndex(level => `${level.height}p` === quality);
      if (levelIndex >= 0) {
        hlsRef.current.currentLevel = levelIndex;
      }
    }
  };

  const changeAudioTrack = (trackIndex: number) => {
    if (hlsRef.current && trackIndex < audioTracks.length) {
      hlsRef.current.audioTrack = trackIndex;
      setSelectedAudioTrack(trackIndex);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } else {
        // Enter fullscreen
        const element = videoRef.current?.parentElement || document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const handleVideoDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFullscreen();
  };

  const formatBandwidth = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (!channel) return null;

return (
    <div 
      className="flex-1 bg-black relative overflow-hidden flex flex-col group cursor-none"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onDoubleClick={handleVideoDoubleClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Channel Name Overlay - Center Top (Shows on Hover) */}
      <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 transition-all duration-300 z-50 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
          {channel.logo && (
            <img 
              src={channel.logo} 
              className="w-8 h-8 object-contain rounded-lg bg-white/10" 
              alt="" 
              onError={(e: any) => (e.currentTarget.style.display = 'none')} 
            />
          )}
          <div className="flex flex-col items-center">
            <h3 className="text-base sm:text-lg lg:text-xl font-black text-white uppercase tracking-tight text-center leading-tight">
              {channel.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest">
                {channel.group}
              </span>
              {streamHealth && (
                <div className={`w-2 h-2 rounded-full ${
                  streamHealth.status === 'healthy' ? 'bg-green-500' : 
                  streamHealth.status === 'slow' ? 'bg-yellow-500' : 'bg-red-500'
                }`} title={`Stream ${streamHealth.status}`} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className={`absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 flex items-center gap-2 transition-opacity duration-500 z-50 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Minimize Button */}
        {onMinimize && (
          <button 
            onClick={onMinimize}
            className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/5"
            title="Minimize to mini player"
          >
            <Minimize2 size={14} className="text-white" />
          </button>
        )}

        {/* Settings Button */}
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/5"
          title="Player settings"
        >
          <Settings size={14} className="text-white" />
        </button>

        {/* Favorite Button */}
        <button 
          onClick={onToggleFavorite}
          className={`p-2 sm:p-3 rounded-full transition-all ${
            isFavorite ? 'bg-amber-400 text-slate-950 shadow-xl shadow-amber-400/30' : 'bg-white/10 text-white backdrop-blur-md border border-white/5'
          }`}
        >
          <Star size={14} fill={isFavorite ? "currentColor" : "none"} strokeWidth={3} />
        </button>
      </div>

      {/* Fullscreen Indicator - Auto-hide after 5 seconds */}
      {isFullscreen && showFullscreenMessage && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
          <span className="text-sm font-bold text-white uppercase tracking-wider">Fullscreen Mode • Double-click to exit</span>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-20 right-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 z-60 min-w-64">
          <div className="space-y-4">
            {/* Playback Speed */}
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                <Gauge size={14} className="inline mr-2" />
                Playback Speed
              </label>
              <div className="grid grid-cols-3 gap-1">
                {PLAYBACK_RATES.map(rate => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`p-2 text-xs rounded-lg transition-all ${
                      playbackRate === rate 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Selection */}
            {availableQualities.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  <Monitor size={14} className="inline mr-2" />
                  Quality
                </label>
                <select
                  value={selectedQuality}
                  onChange={(e) => changeQuality(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm"
                >
                  {availableQualities.map(quality => (
                    <option key={quality} value={quality}>
                      {quality === 'auto' ? 'Auto' : quality}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Audio Tracks */}
            {audioTracks.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                  <Headphones size={14} className="inline mr-2" />
                  Audio Track
                </label>
                <select
                  value={selectedAudioTrack}
                  onChange={(e) => changeAudioTrack(parseInt(e.target.value))}
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm"
                >
                  {audioTracks.map((track, index) => (
                    <option key={index} value={index}>
                      {track.name || `Track ${index + 1}`} {track.lang && `(${track.lang})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Bandwidth Usage */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-xs text-slate-400">
                Session: {formatBandwidth(bandwidthUsage)}
              </div>
              {retryCount > 0 && (
                <div className="text-xs text-yellow-400 mt-1">
                  Retries: {retryCount}/3
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlays - Responsive */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-30 p-4 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
             <Tv size={24} className="text-red-500" />
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white uppercase tracking-tighter mb-2">Stream Offline</h2>
          <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest max-w-xs mb-6 sm:mb-8">{error}</p>
          <div className="flex gap-3">
            <button 
              onClick={retryStream}
              className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition touch-target"
            >
              <RotateCcw size={12} />
              Retry ({3 - retryCount} left)
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-slate-950 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-slate-200 transition touch-target"
            >
              Reload App
            </button>
          </div>
        </div>
      )}

      {/* Cinematic Controls - Responsive */}
      <div className={`absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent transition-all duration-700 transform ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-8">
              <button onClick={onPrevious} className="text-white/60 hover:text-white transition active:scale-90 p-1.5 sm:p-2 touch-target">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button onClick={togglePlay} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition transform touch-target">
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5 sm:ml-1" />}
              </button>
              <button onClick={onNext} className="text-white/60 hover:text-white transition active:scale-90 p-1.5 sm:p-2 touch-target">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="hidden sm:flex items-center gap-2 sm:gap-4 bg-white/5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-white/5">
                <button onClick={() => { if(videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } }} className="text-white/60 hover:text-white transition touch-target">
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={volume}
                  onChange={(e: any) => { const v = parseFloat(e.target.value); setVolume(v); if(videoRef.current) videoRef.current.volume = v; }}
                  className="w-16 sm:w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="flex gap-2 sm:gap-4">
                {isPiPSupported && (
                  <button onClick={async () => { if(videoRef.current) { if(document.pictureInPictureElement) await document.exitPictureInPicture(); else await videoRef.current.requestPictureInPicture(); } }} className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl text-white/80 transition touch-target" title="PiP">
                    <PictureInPicture2 size={14} />
                  </button>
                )}
                <button onClick={toggleFullscreen} className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl text-white/80 transition touch-target" title="Fullscreen">
                  <Maximize size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
