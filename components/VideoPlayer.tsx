
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
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const watchStartTime = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

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
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');

  const controlsTimerRef = useRef<number | null>(null);
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);
  const [nextProgram, setNextProgram] = useState<EPGProgram | null>(null);

  useEffect(() => {
    setIsPiPSupported(
      typeof document !== 'undefined' &&
      'pictureInPictureEnabled' in document &&
      (document as any).pictureInPictureEnabled
    );

    const handleFullscreenChange = () => {
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
      setIsFullscreen(isFull);
    };
    const handleGlobalInteraction = () => resetControlsTimer();

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('keydown', handleGlobalInteraction);
    document.addEventListener('touchstart', handleGlobalInteraction);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
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

    // Check for Mixed Content (HTTP on HTTPS)
    const isHttps = window.location.protocol === 'https:';
    const isChannelHttp = channel.url.startsWith('http:');

    if (isHttps && isChannelHttp) {
      console.warn('Mixed Content detected: Loading HTTP stream on HTTPS site');
      setError('Browser Security Block: This channel uses an insecure (HTTP) link which is blocked on this secure (HTTPS) site. Try using a browser with "Insecure content" allowed for this site.');
      setIsLoading(false);
      // We don't auto-skip here because we want to show the specific error
      return;
    }

    // Set a timeout for loading (20 seconds)
    loadTimeout = window.setTimeout(() => {
      if (isLoading) {
        console.error('Stream loading timeout for:', channel.name);
        updateStreamHealth('failed');
        setIsLoading(false);
        if (hls) {
          hls.destroy();
        }
        setError('Stream loading timed out. The server might be down or blocked by your provider.');
      }
    }, 20000);

    // Local keyboard shortcuts for player
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a') {
        setAspectRatio(prev => {
          if (prev === 'contain') return 'cover';
          if (prev === 'cover') return 'fill';
          return 'contain';
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const isHls = channel.url.toLowerCase().includes('.m3u8') || channel.url.toLowerCase().includes('manifest');

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 60,
        maxMaxBufferLength: 600,
        capLevelToPlayerSize: true,
        autoStartLoad: true,
        startLevel: -1,
        // Improved loading settings
        manifestLoadingTimeOut: 30000,
        manifestLoadingMaxRetry: 10,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 30000,
        levelLoadingMaxRetry: 10,
        levelLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 60000,
        fragLoadingMaxRetry: 10,
        fragLoadingRetryDelay: 1000,
        // Better error recovery
        abrEwmaFastLive: 1,
        abrEwmaSlowLive: 1.5,
        testBandwidth: true,
      });
      hlsRef.current = hls;

      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        if (loadTimeout) window.clearTimeout(loadTimeout);

        // Handle play request with abort protection
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name === 'AbortError') {
              console.log('Playback aborted - normal during channel switch');
            } else {
              console.error('Play error:', err);
              setError(`Playback blocked by browser. Please click Play manually.`);
            }
            setIsPlaying(false);
          });
        }

        setIsLoading(false);
        setRetryCount(0);
        updateStreamHealth('healthy');
        setAvailableQualities(['auto', ...data.levels.map(l => `${l.height}p`)]);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data.details);
          updateStreamHealth('failed');

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount < 5) {
                setRetryCount(prev => prev + 1);
                hls?.startLoad();
              } else {
                setIsLoading(false);
                onNext();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (retryCount < 3) {
                setRetryCount(prev => prev + 1);
                hls?.recoverMediaError();
              } else {
                setIsLoading(false);
                onNext();
              }
              break;
            case Hls.ErrorTypes.OTHER_ERROR:
              setError(`Engine Error: ${data.details}. This channel might use an unsupported codec (like H.265/HEVC or AC3 audio) in your browser.`);
              setIsLoading(false);
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
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      // Native HLS (Safari)
      video.src = channel.url;
      video.addEventListener('loadedmetadata', () => {
        if (loadTimeout) window.clearTimeout(loadTimeout);
        video.play().catch(() => { });
        setIsLoading(false);
        setRetryCount(0);
        updateStreamHealth('healthy');
      });
      video.addEventListener('error', () => {
        if (loadTimeout) window.clearTimeout(loadTimeout);
        updateStreamHealth('failed');
        setIsLoading(false);
        onNext();
      });
    } else {
      // Direct video playback (MP4, etc.)
      console.log('Trying direct video playback for:', channel.url);
      video.src = channel.url;
      video.load();

      const handleCanPlay = () => {
        if (loadTimeout) window.clearTimeout(loadTimeout);
        video.play().catch(() => { });
        setIsLoading(false);
        setRetryCount(0);
        updateStreamHealth('healthy');
        video.removeEventListener('canplay', handleCanPlay);
      };

      const handleError = () => {
        if (loadTimeout) window.clearTimeout(loadTimeout);
        updateStreamHealth('failed');
        setIsLoading(false);
        onNext();
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
    }

    return () => {
      if (loadTimeout) window.clearTimeout(loadTimeout);
      window.removeEventListener('keydown', handleKeyDown);
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
    const el = containerRef.current;
    if (!el) return;

    const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);

    try {
      if (isFull) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
        else if ((document as any).mozCancelFullScreen) await (document as any).mozCancelFullScreen();
        else if ((document as any).msExitFullscreen) await (document as any).msExitFullscreen();
      } else {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
        else if ((el as any).mozRequestFullScreen) await (el as any).mozRequestFullScreen();
        else if ((el as any).msRequestFullscreen) await (el as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn('Main container fullscreen failed, trying video element fallback:', err);
      if (videoRef.current) {
        try {
          if ((videoRef.current as any).webkitEnterFullscreen) {
            (videoRef.current as any).webkitEnterFullscreen();
          } else if (videoRef.current.requestFullscreen) {
            videoRef.current.requestFullscreen();
          }
        } catch (vErr) {
          console.error('Video fallback fullscreen failed:', vErr);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      toggleFullscreen();
      lastTapRef.current = 0; // Reset
    } else {
      lastTapRef.current = now;
      resetControlsTimer();
    }
  };

  if (!channel) return null;

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-black relative overflow-hidden flex flex-col group cursor-none selection:bg-transparent"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={toggleFullscreen}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video
        ref={videoRef}
        className={`w-full h-full object-${aspectRatio}`}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        crossOrigin="anonymous"
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
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'contain', label: 'ORIGINAL' },
                  { id: 'cover', label: 'ZOOM' },
                  { id: 'fill', label: 'STRETCH' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setAspectRatio(mode.id as any)}
                    className={`py-3 text-[10px] font-black rounded-xl transition-all ${aspectRatio === mode.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

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

      {/* Error UI Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[20px] z-[70] p-8 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
            <Monitor className="text-red-500" size={40} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-4 italic">Stream Offline</h3>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest max-w-md leading-relaxed mb-10">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-transform"
            >
              Reload Engine
            </button>
            <button
              onClick={onNext}
              className="px-8 py-4 glass text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border-white/10 hover:bg-white/10 transition-all"
            >
              Skip Channel
            </button>
          </div>
        </div>
      )}

      {/* Loading UI Overlay */}
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
                <button
                  onClick={() => {
                    setAspectRatio(prev => {
                      if (prev === 'contain') return 'cover';
                      if (prev === 'cover') return 'fill';
                      return 'contain';
                    });
                  }}
                  className="p-3 sm:p-4 glass rounded-xl sm:rounded-2xl text-white hover:bg-white/10 transition-all border-white/10 flex items-center gap-2 group/ar"
                  title="Cycle Aspect Ratio"
                >
                  <Monitor size={18} className="sm:size-[20px]" />
                  <span className="hidden sm:inline text-[8px] font-black uppercase tracking-tighter opacity-60 group-hover/ar:opacity-100">
                    {aspectRatio === 'contain' ? 'Original' : aspectRatio === 'cover' ? 'Zoom' : 'Stretch'}
                  </span>
                </button>
                <button onClick={toggleFullscreen} className="p-3 sm:p-4 glass rounded-xl sm:rounded-2xl text-white hover:bg-white/10 transition-all border-white/10" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                  {isFullscreen ? <Minimize2 size={18} className="sm:size-[20px]" /> : <Maximize size={18} className="sm:size-[20px]" />}
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
