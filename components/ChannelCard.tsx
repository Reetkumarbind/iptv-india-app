
import React, { useState, useEffect } from 'react';
import { IPTVChannel } from '../types.ts';
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
  Loader2
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

return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-xl sm:rounded-[1.5rem] lg:rounded-[2rem] bg-slate-900 border border-white/5 transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-600/10 active:scale-[0.98] touch-target">
      <button
        onClick={onClick}
        className="w-full h-full flex flex-col text-left"
      >
        {/* Logo Container with Responsive Lazy Loading */}
        <div className="relative flex-1 w-full flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-slate-800/20 to-transparent transition-all duration-700 group-hover:bg-slate-800/40">
          
          {/* Loading Spinner - Responsive */}
          {channel.logo && !imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Loader2 className="animate-spin text-slate-500" size={16} sm:size={20} lg:size={24} />
            </div>
          )}

          {channel.logo && !imgError ? (
            <img 
              src={channel.logo} 
              alt={channel.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`w-[80%] sm:w-[85%] h-[80%] sm:h-[85%] object-contain filter drop-shadow-2xl transition-all duration-700 group-hover:scale-105 sm:group-hover:scale-110 ${
                imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-slate-700 group-hover:text-blue-500/30 transition-colors">
              <GroupIcon size={32} sm:size={48} lg:size={56} strokeWidth={1} />
            </div>
          )}
          
          {/* Play Overlay - Responsive */}
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
             <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500">
                <Play size={16} sm:size={20} lg:size={28} fill="currentColor" className="ml-0.5 sm:ml-1" />
             </div>
          </div>
        </div>
        
        {/* Title Area - Responsive */}
        <div className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5 pt-1.5 sm:pt-2">
          <h3 className="text-[10px] sm:text-xs lg:text-sm font-black text-slate-100 truncate mb-1 uppercase tracking-tight">
            {channel.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
              {channel.group || 'General'}
            </span>
          </div>
        </div>
      </button>

      {/* Favorite Button - Responsive */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 p-1.5 sm:p-2 lg:p-2.5 rounded-full transition-all duration-300 transform active:scale-90 touch-target ${
          isFavorite 
            ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-110' 
            : 'bg-black/60 text-white/40 scale-90 hover:scale-100 hover:text-white backdrop-blur-md border border-white/5'
        }`}
        title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
      >
        <Star size={12} sm:size={14} lg:size={16} fill={isFavorite ? "currentColor" : "none"} strokeWidth={3} />
      </button>

      {/* Toast Feedback - Responsive */}
      {showFeedback && (
        <div className="absolute inset-x-2 sm:inset-x-3 lg:inset-x-4 top-2 sm:top-3 lg:top-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
          <div className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-xl border border-white/10 ${
            isFavorite ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
          }`}>
            {isFavorite ? 'Saved' : 'Removed'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelCard;
