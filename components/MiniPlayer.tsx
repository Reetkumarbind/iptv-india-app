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
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setIsPlaying(false));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
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
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 320;
    const maxY = window.innerHeight - 180;
    
    onPositionChange({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
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
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
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
      className="fixed z-[150] w-80 bg-slate-900 rounded-lg border border-white/20 shadow-2xl overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-slate-800 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {channel.logo && (
            <img src={channel.logo} alt="" className="w-5 h-5 object-contain" />
          )}
          <span className="text-sm font-bold text-white truncate">{channel.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMaximize}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Maximize"
          >
            <Maximize2 size={14} className="text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Close"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="relative aspect-video bg-black">
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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={togglePlay}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause size={16} className="text-white" fill="currentColor" />
              ) : (
                <Play size={16} className="text-white ml-0.5" fill="currentColor" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {isMuted ? (
                <VolumeX size={16} className="text-white" />
              ) : (
                <Volume2 size={16} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;