
import React, { useState, useEffect } from 'react';
import { IPTVChannel } from '../types.ts';
import { EPGService, EPGProgram } from '../services/epgService';
import {
  Play,
  Star,
  Newspaper,
  Trophy,
  Film,
  Music,
  Baby,
  Tv,
  Sparkles,
  LayoutGrid,
  Loader2,
  Clock,
  Calendar
} from 'lucide-react';

interface ChannelCardProps {
  channel: IPTVChannel;
  isActive: boolean;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'News': Newspaper,
  'Sports': Trophy,
  'Movies': Film,
  'Music': Music,
  'Kids': Baby,
  'Entertainment': Sparkles,
  'General': Tv,
  'Other': LayoutGrid,
};

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, isActive, isFavorite, onClick, onToggleFavorite }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<EPGProgram | null>(null);

  const GroupIcon = CATEGORY_ICONS[channel.group] || CATEGORY_ICONS['Other'];

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
    setShowFeedback(true);
  };

  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => setShowFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  useEffect(() => {
    const updateProgram = () => {
      setCurrentProgram(EPGService.getProgramForChannel(channel));
    };
    updateProgram();
    const interval = setInterval(updateProgram, 60000);
    return () => clearInterval(interval);
  }, [channel]);

  const progress = currentProgram
    ? ((Date.now() - currentProgram.start) / (currentProgram.end - currentProgram.start)) * 100
    : 0;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="group relative aspect-[1.586/2] overflow-hidden rounded-3xl bg-black hover:scale-[1.02] transition-all duration-500 ease-out shadow-2xl hover:shadow-primary/30 border-2 border-white/20">
      <button
        onClick={onClick}
        className="w-full h-full flex flex-col text-left"
      >
        {/* Banner/Logo Container - Takes up more space now */}
        <div className="relative h-[65%] w-full overflow-hidden bg-black">
          {channel.logo && !imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
          )}

          {channel.logo && !imgError ? (
            <>
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <Loader2 className="animate-spin text-white/30" size={32} />
                </div>
              )}
              <div className="w-full h-full bg-black flex items-center justify-center p-8">
                <img
                  src={channel.logo}
                  alt={channel.name}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImgLoaded(true)}
                  className={`max-w-full max-h-full object-contain transition-all duration-700 ${
                    imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                  onError={() => setImgError(true)}
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 bg-black">
              <GroupIcon size={64} strokeWidth={1.5} />
            </div>
          )}

          {/* Premium Overlay Gradient - Subtle for logo visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Interactive States - Larger play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/60 backdrop-blur-sm">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-950 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
              <Play size={32} fill="currentColor" className="ml-1" />
            </div>
          </div>

          {/* Channel Name Frame at Bottom Center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%]">
            <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl px-4 py-3 shadow-2xl">
              <h3 className="text-sm font-black text-white text-center uppercase tracking-wide truncate">
                {channel.name}
              </h3>
            </div>
          </div>

          {/* Labels Overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
              {channel.group || 'General'}
            </span>
            {currentProgram && (
              <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-600/90 backdrop-blur-md text-[10px] font-black text-white uppercase animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                Live
              </span>
            )}
          </div>

          {/* Progress Bar for Live Content */}
          {currentProgram && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
              <div
                className="h-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.5)] transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>

        {/* Enhanced Info Content - More space for details */}
        <div className="h-[35%] p-6 bg-black border-t-2 border-white/20 relative flex flex-col justify-between">
          <div>
            {currentProgram ? (
              <>
                <p className="text-sm font-bold text-slate-300 truncate mb-2 leading-relaxed">
                  {currentProgram.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={12} className="flex-shrink-0" />
                  <span className="font-medium">
                    {formatTime(currentProgram.start)} - {formatTime(currentProgram.end)}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 truncate">
                  Premium Content
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar size={12} />
                  <span>Available 24/7</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Channel Quality Badge */}
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
              HD
            </span>
            {isFavorite && (
              <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/20">
                Favorite
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Action Buttons Overlay */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all duration-300 transform ${isFavorite
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 scale-100'
            : 'bg-black/40 backdrop-blur-md text-white/40 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100 hover:text-white border border-white/10'
          }`}
      >
        <Star size={16} fill={isFavorite ? "currentColor" : "none"} strokeWidth={3} />
      </button>

      {/* Toast Feedback */}
      {showFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-in fade-in zoom-in duration-300">
          <div className="px-4 py-2 rounded-full bg-primary text-slate-950 text-xs font-black uppercase tracking-[0.2em] shadow-2xl">
            {isFavorite ? 'Saved' : 'Removed'}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ChannelCard);
