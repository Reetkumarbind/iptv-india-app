
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
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
    }, 4000);
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
      className="flex-1 bg-black relative overflow-hidden flex flex-col group"
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
      <div className={`absolute top-0 inset-x-0 p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-black/95 via-black/40 to-transparent transition-opacity duration-500 z-50 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            <button
              onClick={onExit}
              className="flex items-center justify-center p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all border border-white/10 active:scale-95 group flex-shrink-0 backdrop-blur-xl"
              title="Exit to Gallery"
            >
              <ChevronLeft size={20} className="text-white group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="h-8 sm:h-10 w-[1px] bg-white/10 hidden sm:block" />

            {channel.logo && (
              <img src={channel.logo} className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl bg-white/10 p-1 flex-shrink-0" alt="" />
            )}
            <div className="overflow-hidden">
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white uppercase tracking-tight leading-tight truncate">
                {channel.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-widest truncate">{channel.group}</span>
                {streamHealth && (
                  <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${streamHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {onShowKeyboard && (
              <button onClick={onShowKeyboard} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/5 text-white hidden sm:flex" title="Keyboard Shortcuts">
                <KeyboardIcon size={18} />
              </button>
            )}
            {onMinimize && (
              <button onClick={onMinimize} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/5 text-white" title="Minimize">
                <Minimize2 size={18} />
              </button>
            )}
            <button onClick={() => setShowSettings(!showSettings)} className={`p-2 sm:p-3 rounded-full transition-all backdrop-blur-md border border-white/5 ${showSettings ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`} title="Settings">
              <Settings size={18} />
            </button>
            <button onClick={onToggleFavorite} className={`p-2 sm:p-3 rounded-full transition-all ${isFavorite ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' : 'bg-white/10 text-white backdrop-blur-md border border-white/5'}`} title="Favorite">
              <Star size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute top-24 right-8 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 z-[60] min-w-[280px] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                <Gauge size={14} /> Playback Speed
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PLAYBACK_RATES.map(rate => (
                  <button key={rate} onClick={() => changePlaybackRate(rate)} className={`py-2 text-xs font-bold rounded-lg transition-all ${playbackRate === rate ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {availableQualities.length > 1 && (
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                  <Monitor size={14} /> Quality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableQualities.map(q => (
                    <button key={q} onClick={() => changeQuality(q)} className={`py-2 text-xs font-bold rounded-lg transition-all ${selectedQuality === q ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                      {q === 'auto' ? 'Auto' : q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Bandwidth</span>
                <span className="text-slate-300">{(bandwidthUsage / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retry indicator - only shown briefly */}
      {error && error.includes('retrying') && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl rounded-2xl px-6 py-3 z-[70] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="animate-spin text-blue-500" />
            <span className="text-sm font-bold text-white">Retrying connection...</span>
          </div>
        </div>
      )}

      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
          <Loader2 size={48} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Bottom Controls */}
      <div className={`absolute inset-x-0 bottom-0 p-6 lg:p-8 bg-gradient-to-t from-black via-black/80 to-transparent transition-all duration-700 transform ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="max-w-5xl mx-auto flex flex-col gap-6">

          {currentProgram && (
            <div className="flex flex-col gap-3 bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 bg-blue-600 rounded text-[8px] font-black uppercase tracking-widest text-white">Live</span>
                    <h4 className="text-sm font-black text-white uppercase truncate tracking-tight">{currentProgram.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{currentProgram.description}</p>
                </div>

                <div className="hidden md:flex flex-col items-end text-right gap-0.5">
                  {nextChannelName ? (
                    <>
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Next Channel</span>
                      <span className="text-sm font-black text-white truncate max-w-[180px] uppercase tracking-tighter leading-none">{nextChannelName}</span>
                      {nextProgram && (
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-60">Upcoming: {nextProgram.title}</span>
                      )}
                    </>
                  ) : nextProgram && (
                    <>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Next Show</span>
                      <span className="text-xs font-bold text-slate-300 truncate max-w-[150px] uppercase tracking-tighter">{nextProgram.title}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${Math.min(100, progress)}%` }} />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">
                  <span>{new Date(currentProgram.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>{new Date(currentProgram.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={onPrevious} className="text-white/60 hover:text-white transition active:scale-90"><SkipBack size={24} fill="currentColor" /></button>
              <button onClick={togglePlay} className="w-16 h-16 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition transform">
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={onNext} className="text-white/60 hover:text-white transition active:scale-90"><SkipForward size={24} fill="currentColor" /></button>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                <button onClick={() => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } }} className="text-white/60 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e: any) => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; }} className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
              <div className="flex gap-4">
                {isPiPSupported && (
                  <button onClick={async () => { if (videoRef.current) (document.pictureInPictureElement) ? await document.exitPictureInPicture() : await videoRef.current.requestPictureInPicture(); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition"><PictureInPicture2 size={16} /></button>
                )}
                <button onClick={toggleFullscreen} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition"><Maximize size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
