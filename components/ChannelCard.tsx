
import React, { useState, useEffect } from 'react';
import { IPTVChannel } from '../types';
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
  X
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
    <div className="group relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-slate-900 border border-white/5 transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-600/10 active:scale-[0.98]">
      <button
        onClick={onClick}
        className="w-full h-full flex flex-col text-left"
      >
        {/* Logo Container */}
        <div className="relative flex-1 w-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-800/20 to-transparent transition-all duration-700 group-hover:bg-slate-800/40">
          {channel.logo && !imgError ? (
            <img 
              src={channel.logo} 
              alt="" 
              className="w-[80%] h-[80%] object-contain filter drop-shadow-2xl transition-all duration-700 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-700 group-hover:text-blue-500/30 transition-colors">
              <GroupIcon size={56} strokeWidth={1} />
            </div>
          )}
          
          {/* Play Icon Hidden by default, shown on hover/active */}
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
             <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500">
                <Play size={28} fill="currentColor" className="ml-1" />
             </div>
          </div>
        </div>
        
        {/* Title Area - Fixed height for alignment */}
        <div className="px-5 pb-5 pt-2">
          <h3 className="text-xs sm:text-sm font-black text-slate-100 truncate mb-1 uppercase tracking-tight">
            {channel.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
              {channel.group || 'General'}
            </span>
          </div>
        </div>
      </button>

      {/* Mobbin-style Floating Action Button for Favorite */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-4 right-4 p-2.5 rounded-full transition-all duration-300 transform active:scale-90 ${
          isFavorite 
            ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-100' 
            : 'bg-black/60 text-white/40 scale-90 hover:scale-100 hover:text-white backdrop-blur-md'
        }`}
      >
        <Star size={16} fill={isFavorite ? "currentColor" : "none"} strokeWidth={3} />
      </button>

      {/* Elegant Toast Feedback */}
      {showFeedback && (
        <div className="absolute inset-x-4 top-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
          <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-xl border border-white/10 ${
            isFavorite ? 'bg-amber-400 text-slate-950 border-amber-500' : 'bg-slate-800 text-white'
          }`}>
            {isFavorite ? 'Saved' : 'Removed'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelCard;
