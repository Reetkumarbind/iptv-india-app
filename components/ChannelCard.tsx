
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
  Clock
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

  return (
    <div className="group relative aspect-[1.586/1] overflow-hidden glass-card hover:scale-[1.03] transition-all duration-500 ease-out shadow-2xl hover:shadow-primary/20">
      <button
        onClick={onClick}
        className="w-full h-full flex flex-col text-left"
      >
        {/* Banner/Logo Container */}
        <div className="relative flex-1 w-full overflow-hidden bg-slate-900">
          {channel.logo && !imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary/30" size={32} />
            </div>
          )}

          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover object-[center_30%] transition-all duration-700 group-hover:scale-110 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/10 group-hover:text-primary/20 transition-colors bg-gradient-to-br from-slate-900 to-slate-800">
              <GroupIcon size={64} strokeWidth={1} />
            </div>
          )}

          {/* Premium Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

          {/* Interactive States */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px]">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-950 shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500">
              <Play size={28} fill="currentColor" className="ml-1" />
            </div>
          </div>

          {/* Labels Overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
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

        {/* Info Content - ATM card style */}
        <div className="p-5 bg-slate-950 border-t border-white/5 relative">
          <h3 className="text-base font-bold text-white truncate uppercase tracking-wide group-hover:text-primary transition-colors leading-tight mb-1">
            {channel.name}
          </h3>
          {currentProgram ? (
            <p className="text-sm font-medium text-slate-400 truncate uppercase tracking-wider">
              {currentProgram.title}
            </p>
          ) : (
            <p className="text-sm font-medium text-slate-500 truncate uppercase tracking-wider">
              Premium Content
            </p>
          )}
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

export default ChannelCard;
