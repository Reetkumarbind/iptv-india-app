
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { IPTVChannel, StreamHealth } from '../types';
import { StorageService } from '../services/storageService';
import { EPGService, EPGProgram } from '../services/epgService';
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
  Gauge,
  Monitor,
  ChevronLeft,
  Keyboard as KeyboardIcon
} from 'lucide-react';

interface VideoPlayerProps {
  channel: IPTVChannel | null;
  nextChannelName?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onMinimize?: () => void;
  onExit: () => void;
  onShowKeyboard?: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  nextChannelName,
  isFavorite,
  onToggleFavorite,
  onNext,
  onPrevious,
  onMinimize,
  onExit,
  onShowKeyboard
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const watchStartTime = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isPiPSupported, setIsPiPSupported] = useState(false);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>(['auto']);
  const [showSettings, setShowSettings] = useState(false);
  const [streamHealth, setStreamHealth] = useState<StreamHealth | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [bandwidthUsage, setBandwidthUsage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const controlsTimerRef = useRef<number | null>(null);
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);
  const [nextProgram, setNextProgram] = useState<EPGProgram | null>(null);

  useEffect(() => {
    setIsPiPSupported(
      typeof document !== 'undefined' &&
      'pictureInPictureEnabled' in document &&
      (document as any).pictureInPictureEnabled
    );

    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleGlobalInteraction = () => resetControlsTimer();

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleGlobalInteraction);
    document.addEventListener('touchstart', handleGlobalInteraction);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleGlobalInteraction);
      document.removeEventListener('touchstart', handleGlobalInteraction);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!channel) return;
    const updatePrograms = () => {
      setCurrentProgram(EPGService.getProgramForChannel(channel));
      setNextProgram(EPGService.getNextProgramForChannel(channel));
    };
    updatePrograms();
    const interval = setInterval(updatePrograms, 60000);
    return () => clearInterval(interval);
  }, [channel]);

  const progress = currentProgram
    ? ((Date.now() - currentProgram.start) / (currentProgram.end - currentProgram.start)) * 100
    : 0;

  const trackWatchTime = useCallback(() => {
    if (!channel || !watchStartTime.current) return;
    const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
    if (watchDuration > 2) {
      StorageService.addToWatchHistory({
        channelId: channel.id,
        channelName: channel.name,
        timestamp: Date.now(),
        duration: watchDuration,
        logo: channel.logo || undefined
      });
    }
  }, [channel]);

  const updateStreamHealth = useCallback((status: 'healthy' | 'slow' | 'failed', latency: number = 0) => {
    if (!channel) return;
    const health: StreamHealth = { channelId: channel.id, status, latency, lastChecked: Date.now() };
    setStreamHealth(health);
    StorageService.updateStreamHealth(health);
  }, [channel]);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    watchStartTime.current = Date.now();
    let hls: Hls | null = null;
    let loadTimeout: number | null = null;
    setIsLoading(true);
    setError(null);

    // Set a timeout for loading (20 seconds)
    loadTimeout = window.setTimeout(() => {
      if (isLoading) {
        console.error('Stream loading timeout for:', channel.name);
        updateStreamHealth('failed');
        setIsLoading(false);
        if (hls) {
          hls.destroy();
        }
        // Auto skip to next channel
        onNext();
      }
    }, 20000);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxLoadingDelay: 8,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 15000,
        fragLoadingTimeOut: 30000,
        manifestLoadingRetryDelay: 1000,
        levelLoadingRetryDelay: 1000,
        fragLoadingRetryDelay: 1000
      });
      hlsRef.current = hls;

      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (loadTimeout) window.clearTimeout(loadTimeout);
        video.play().catch((err) => {
          console.error('Play error:', err);
          setIsPlaying(false);
        });
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
        updateStreamHealth('healthy');
        setAvailableQualities(['auto', ...hls!.levels.map(l => `${l.height}p`)]);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data.type, data.details, data.fatal);

        if (data.fatal) {
          if (loadTimeout) window.clearTimeout(loadTimeout);
          updateStreamHealth('failed');

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error - attempting recovery');
              if (retryCount < 3) {
                setError('Network error - retrying...');
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                  if (hls) {
                    hls.startLoad();
                  }
                }, 1500);
              } else {
                console.log('Max retries reached, skipping to next channel');
                setIsLoading(false);
                onNext();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error - attempting recovery');
              if (retryCount < 2) {
                setRetryCount(prev => prev + 1);
                hls.recoverMediaError();
              } else {
                console.log('Media error recovery failed, skipping to next channel');
                setIsLoading(false);
                onNext();
              }
              break;
            default:
              console.log('Fatal error, skipping to next channel');
              setIsLoading(false);
              onNext();
              break;
          }
        }
      });

      hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        if (loadTimeout) window.clearTimeout(loadTimeout);
        setBandwidthUsage(prev => prev + data.frag.stats.total);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.onloadedmetadata = () => {
        if (loadTimeout) window.clearTimeout(loadTimeout);
        video.play().catch(() => { });
        setIsLoading(false);
        setRetryCount(0);
        updateStreamHealth('healthy');
      };
      video.onerror = () => {
        if (loadTimeout) window.clearTimeout(loadTimeout);
        updateStreamHealth('failed');
        setIsLoading(false);
        console.log('Native video error, skipping to next channel');
        onNext();
      };
    }

    return () => {
      if (loadTimeout) window.clearTimeout(loadTimeout);
      trackWatchTime();
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, retryCount, trackWatchTime, updateStreamHealth]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play().catch(() => { });
    setIsPlaying(!isPlaying);
    resetControlsTimer();
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
    if (quality === 'auto') hlsRef.current.currentLevel = -1;
    else {
      const idx = hlsRef.current.levels.findIndex(l => `${l.height}p` === quality);
      if (idx >= 0) hlsRef.current.currentLevel = idx;
    }
  };

  const toggleFullscreen = async () => {
    const el = videoRef.current?.parentElement || document.documentElement;
    if (isFullscreen) await document.exitFullscreen().catch(() => { });
    else await el.requestFullscreen().catch(() => { });
  };

  if (!channel) return null;

  return (
    <div
      className="flex-1 bg-black relative overflow-hidden flex flex-col group cursor-none selection:bg-transparent"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Top Header Overlay */}
      <div className={`absolute top-0 inset-x-0 p-4 sm:p-8 pt-6 sm:pt-10 bg-gradient-to-b from-black/80 via-black/20 to-transparent transition-all duration-500 z-50 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-2 sm:gap-8">
          <div className="flex items-center gap-3 sm:gap-6 overflow-hidden min-w-0">
            <button
              onClick={onExit}
              className="p-2.5 sm:p-4 glass rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all group border-white/10 flex-shrink-0"
            >
              <ChevronLeft size={20} className="text-white group-hover:-translate-x-1 transition-transform sm:size-[24px]" />
            </button>

            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
              {channel.logo && (
                <div className="w-10 h-10 sm:w-14 sm:h-14 glass rounded-lg sm:rounded-2xl p-1 sm:p-2 flex items-center justify-center border-white/10 flex-shrink-0">
                  <img src={channel.logo} className="w-full h-full object-contain filter drop-shadow-lg" alt="" />
                </div>
              )}
              <div className="overflow-hidden">
                <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                  <span className="px-1.5 py-0.5 rounded-md bg-primary text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-lg shadow-primary/20 animate-pulse flex-shrink-0">Live</span>
                  <h3 className="text-sm sm:text-xl font-black text-white uppercase tracking-tighter truncate leading-none">
                    {channel.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[8px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.1em] sm:tracking-[0.3em] truncate">{channel.group}</span>
                  {streamHealth && (
                    <div className="hidden xs:flex items-center gap-1.5 sm:gap-2">
                      <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${streamHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_8px_red]'}`} />
                      <span className="text-[8px] sm:text-[10px] font-bold text-text-muted/60 uppercase lg:inline">{streamHealth.status}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {onMinimize && (
              <button onClick={onMinimize} className="p-2.5 sm:p-4 glass rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all border-white/10 text-white">
                <Minimize2 size={18} className="sm:size-[20px]" />
              </button>
            )}
            <button onClick={() => setShowSettings(!showSettings)} className={`p-2.5 sm:p-4 glass rounded-xl sm:rounded-2xl transition-all border-white/10 ${showSettings ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white hover:bg-white/10'}`}>
              <Settings size={18} className="sm:size-[20px]" />
            </button>
            <button onClick={onToggleFavorite} className={`p-2.5 sm:p-4 glass rounded-xl sm:rounded-2xl transition-all border-white/10 ${isFavorite ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-white hover:bg-white/10'}`}>
              <Star size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={3} className="sm:size-[20px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal - Repositioned and Redesigned */}
      {showSettings && (
        <div className="absolute top-32 right-8 glass p-8 rounded-[2.5rem] z-[60] min-w-[320px] shadow-2xl border-white/10 animate-in fade-in zoom-in-95">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
            <Settings size={14} /> Playback Engine
          </h4>

          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Engine Speed</label>
              <div className="grid grid-cols-3 gap-2">
                {PLAYBACK_RATES.map(rate => (
                  <button key={rate} onClick={() => changePlaybackRate(rate)} className={`py-3 text-[10px] font-black rounded-xl transition-all ${playbackRate === rate ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}>
                    {rate}X
                  </button>
                ))}
              </div>
            </div>

            {availableQualities.length > 1 && (
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Stream Resolution</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableQualities.map(q => (
                    <button key={q} onClick={() => changeQuality(q)} className={`py-3 text-[10px] font-black rounded-xl transition-all ${selectedQuality === q ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}>
                      {q === 'auto' ? 'AUTO-DETECTION' : q.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Gauge size={14} className="text-secondary" />
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Cache Usage</span>
                </div>
                <span className="text-[10px] font-black text-white">{(bandwidthUsage / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Center UI Overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[12px] z-20">
          <div className="relative transform scale-75 sm:scale-100">
            <div className="w-24 h-24 border-2 border-primary/20 rounded-full animate-ping absolute inset-0" />
            <div className="w-24 h-24 border-t-2 border-primary rounded-full animate-spin relative flex items-center justify-center">
              <Tv size={32} className="text-white animate-pulse" />
            </div>
          </div>
        </div>
      )}

      <div className={`absolute inset-x-0 bottom-0 p-4 sm:p-8 lg:p-12 bg-gradient-to-t from-black via-black/40 to-transparent transition-all duration-700 transform ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className="max-w-[1280px] mx-auto">
          {/* Main Controls Overlay - Centered Layout */}
          <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-12">

            {/* Playback Controls */}
            <div className="flex items-center gap-8 sm:gap-12 md:gap-16">
              <button onClick={onPrevious} className="text-white/40 hover:text-white transition-all transform hover:scale-125 active:scale-90">
                <SkipBack size={24} fill="currentColor" className="sm:size-[28px] md:size-[32px]" />
              </button>

              <button onClick={togglePlay} className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all transform group">
                {isPlaying ? <Pause size={28} fill="currentColor" className="sm:size-[32px] md:size-[38px]" /> : <Play size={28} fill="currentColor" className="ml-1 sm:ml-2 sm:size-[32px] md:size-[38px]" />}
              </button>

              <button onClick={onNext} className="text-white/40 hover:text-white transition-all transform hover:scale-125 active:scale-90">
                <SkipForward size={24} fill="currentColor" className="sm:size-[28px] md:size-[32px]" />
              </button>
            </div>

            {/* Bottom Group: Volume & Options */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3 sm:gap-6 glass px-4 sm:px-6 py-2.5 sm:py-4 rounded-full sm:rounded-[2rem] border-white/10 group/volume">
                <button
                  onClick={() => { if (videoRef.current) { const newMuted = !isMuted; videoRef.current.muted = newMuted; setIsMuted(newMuted); } }}
                  className="text-white/60 hover:text-primary transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} className="sm:size-[20px]" /> : <Volume2 size={18} className="sm:size-[20px]" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e: any) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (videoRef.current) {
                      videoRef.current.volume = v;
                      videoRef.current.muted = v === 0;
                      setIsMuted(v === 0);
                    }
                  }}
                  className="w-20 sm:w-32"
                />
              </div>

              <div className="flex gap-2 sm:gap-3">
                {isPiPSupported && (
                  <button
                    onClick={async () => {
                      try {
                        if (videoRef.current) {
                          (document.pictureInPictureElement)
                            ? await document.exitPictureInPicture()
                            : await videoRef.current.requestPictureInPicture();
                        }
                      } catch (e) {
                        console.error("PiP error", e);
                      }
                    }}
                    className="p-3 sm:p-4 glass rounded-xl sm:rounded-2xl text-white hover:bg-white/10 transition-all border-white/10"
                  >
                    <PictureInPicture2 size={18} className="sm:size-[20px]" />
                  </button>
                )}
                <button onClick={toggleFullscreen} className="p-3 sm:p-4 glass rounded-xl sm:rounded-2xl text-white hover:bg-white/10 transition-all border-white/10">
                  <Maximize size={18} className="sm:size-[20px]" />
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
