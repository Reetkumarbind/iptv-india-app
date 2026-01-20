import React, { useRef, useEffect, useState } from 'react';
import { IPTVChannel } from '../types';
import Hls from 'hls.js';
import { Play, Pause, X, Maximize2, Volume2, VolumeX } from 'lucide-react';

interface MiniPlayerProps {
  channel: IPTVChannel | null;
  isVisible: boolean;
  onClose: () => void;
  onMaximize: () => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  channel,
  isVisible,
  onClose,
  onMaximize,
  position,
  onPositionChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel || !isVisible) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 5,
        maxMaxBufferLength: 10
      });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setIsPlaying(false));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => { });
      });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [channel, isVisible]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - 320;
    const maxY = window.innerHeight - 180;

    onPositionChange({
      x: Math.max(10, Math.min(newX, maxX - 10)),
      y: Math.max(10, Math.min(newY, maxY - 10))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play().catch(() => { });
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!isVisible || !channel) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed z-[150] w-80 glass bg-[#020617]/90 rounded-[2rem] border-white/10 shadow-2xl overflow-hidden transition-shadow duration-300 ${isDragging ? 'shadow-primary/20 scale-[1.02]' : ''}`}
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-white/5 cursor-grab active:cursor-grabbing border-b border-white/5"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {channel.logo && (
            <div className="w-5 h-5 bg-black rounded flex items-center justify-center p-0.5 border-2 border-white/20">
              <img src={channel.logo} alt="" className="w-full h-full object-contain" />
            </div>
          )}
          <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate">{channel.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMaximize}
            className="p-1.5 glass rounded-lg hover:bg-white/10 transition-colors border-white/10 text-white"
            title="Maximize"
          >
            <Maximize2 size={12} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 glass rounded-lg hover:bg-red-500/20 transition-colors border-white/10 text-white hover:text-red-500"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="relative aspect-video bg-black group">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
          muted={isMuted}
        />

        {/* Controls overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
          <button
            onClick={togglePlay}
            className="p-3 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-transform"
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} className="ml-0.5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-xl transition-all"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Status Line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div className="h-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse" style={{ width: isPlaying ? '100%' : '0%' }} />
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;