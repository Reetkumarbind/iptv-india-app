
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { IPTVChannel } from '../types.ts';
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
  ChevronLeft
} from 'lucide-react';

interface VideoPlayerProps {
  channel: IPTVChannel | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, isFavorite, onToggleFavorite, onNext, onPrevious }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const controlsTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsPiPSupported(
      typeof document !== 'undefined' && 
      'pictureInPictureEnabled' in document && 
      (document as any).pictureInPictureEnabled
    );
  }, []);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 4000);
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

    let hls: Hls | null = null;
    setIsLoading(true);
    setError(null);

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setIsPlaying(false));
        setIsLoading(false);
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError('Stream unavailable. Please try another channel.');
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      const onLoaded = () => {
        video.play().catch(() => {});
        setIsLoading(false);
      };
      video.addEventListener('loadedmetadata', onLoaded);
      return () => video.removeEventListener('loadedmetadata', onLoaded);
    }

    return () => { if (hls) hls.destroy(); };
  }, [channel]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
      resetControlsTimer();
    }
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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Top Bar Controls */}
      <div className={`absolute top-0 left-0 right-0 p-6 flex items-center justify-between transition-opacity duration-500 z-50 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-4 bg-slate-950/40 backdrop-blur-xl p-2 pr-6 rounded-full border border-white/5 shadow-2xl">
          <img src={channel.logo || ''} className="w-8 h-8 object-contain rounded-lg bg-white/10" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div className="flex flex-col">
            <h3 className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[120px]">{channel.name}</h3>
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{channel.group}</span>
          </div>
        </div>

        <button 
          onClick={onToggleFavorite}
          className={`p-3 rounded-full transition-all ${
            isFavorite ? 'bg-amber-400 text-slate-950 shadow-xl shadow-amber-400/30' : 'bg-white/10 text-white backdrop-blur-md'
          }`}
        >
          <Star size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={3} />
        </button>
      </div>

      {/* Overlays */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
          <Loader2 size={48} className="animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-30 p-8 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
             <Tv size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Stream Offline</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Cinematic Controls */}
      <div className={`absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent transition-all duration-700 transform ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={onPrevious} className="text-white/60 hover:text-white transition active:scale-90 p-2">
                <SkipBack size={28} fill="currentColor" />
              </button>
              <button onClick={togglePlay} className="w-16 h-16 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition transform">
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={onNext} className="text-white/60 hover:text-white transition active:scale-90 p-2">
                <SkipForward size={28} fill="currentColor" />
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                <button onClick={() => { if(videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } }} className="text-white/60 hover:text-white transition">
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={volume}
                  onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if(videoRef.current) videoRef.current.volume = v; }}
                  className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="flex gap-4">
                {isPiPSupported && (
                  <button onClick={async () => { if(videoRef.current) { if(document.pictureInPictureElement) await document.exitPictureInPicture(); else await videoRef.current.requestPictureInPicture(); } }} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/80 transition" title="PiP">
                    <PictureInPicture2 size={20} />
                  </button>
                )}
                <button onClick={() => videoRef.current?.requestFullscreen()} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/80 transition" title="Fullscreen">
                  <Maximize size={20} />
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
