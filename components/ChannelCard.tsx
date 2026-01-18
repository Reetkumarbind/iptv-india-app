
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
    <div className="group relative aspect-[3/4] glass-card overflow-hidden hover:scale-[1.03] active:scale-[0.98]">
      <button
        onClick={onClick}
        className="w-full h-full flex flex-col text-left"
      >
        {/* Logo Container */}
        <div className="relative flex-1 w-full flex items-center justify-center p-6 bg-gradient-to-br from-white/5 to-transparent">
          {channel.logo && !imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary/30" size={24} />
            </div>
          )}

          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`w-[80%] h-[80%] object-contain filter drop-shadow-2xl transition-all duration-700 group-hover:scale-110 ${
                imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/20 group-hover:text-primary/40 transition-colors">
              <GroupIcon size={64} strokeWidth={1} />
            </div>
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[4px]">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500">
              <Play size={32} fill="currentColor" className="ml-1" />
            </div>
          </div>

          {/* Live Progress Bar (Always visible if live) */}
          {currentProgram && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 bg-gradient-to-t from-background/80 to-transparent">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">
              {channel.group || 'General'}
            </span>
            {currentProgram && (
              <span className="flex items-center gap-1 text-[8px] font-black text-secondary uppercase animate-pulse">
                <span className="w-1 h-1 bg-secondary rounded-full" />
                Live
              </span>
            )}
          </div>
          <h3 className="text-sm font-black text-white truncate uppercase tracking-tight mb-1">
            {channel.name}
          </h3>
          {currentProgram && (
            <p className="text-[10px] font-bold text-text-muted truncate uppercase tracking-wider">
              {currentProgram.title}
            </p>
          )}
        </div>
      </button>

      {/* Favorite Button */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-4 right-4 p-2.5 rounded-2xl transition-all duration-300 transform active:scale-90 ${
          isFavorite
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 scale-110'
            : 'glass text-white/40 opacity-0 group-hover:opacity-100 scale-90 hover:scale-110 hover:text-white'
        }`}
      >
        <Star size={16} fill={isFavorite ? "currentColor" : "none"} strokeWidth={3} />
      </button>

      {/* Feedback Toast */}
      {showFeedback && (
        <div className="absolute inset-x-4 top-4 pointer-events-none fade-in">
          <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest glass ${
            isFavorite ? 'text-red-400' : 'text-primary'
          }`}>
            {isFavorite ? 'Saved to Favorites' : 'Removed from Favorites'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelCard;
