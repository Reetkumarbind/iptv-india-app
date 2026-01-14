import React from 'react';
import { WatchHistoryItem, IPTVChannel } from '../types';
import { Clock, Play } from 'lucide-react';

interface RecentlyWatchedProps {
  recentChannels: WatchHistoryItem[];
  channels: IPTVChannel[];
  onSelectChannel: (channelId: string) => void;
}

const RecentlyWatched: React.FC<RecentlyWatchedProps> = ({ 
  recentChannels, 
  channels, 
  onSelectChannel 
}) => {
  if (recentChannels.length === 0) return null;

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="text-blue-500" size={20} />
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Recently Watched</h2>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {recentChannels.slice(0, 10).map((item) => {
          const channel = channels.find(c => c.id === item.channelId);
          if (!channel) return null;

          return (
            <div
              key={item.channelId}
              onClick={() => onSelectChannel(item.channelId)}
              className="group flex-shrink-0 w-32 cursor-pointer"
            >
              <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden mb-2 border border-white/10 hover:border-blue-500/50 transition-all">
                {item.logo ? (
                  <img 
                    src={item.logo} 
                    alt={item.channelName}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="text-slate-600" size={24} />
                  </div>
                )}
                
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <Play className="text-blue-600 ml-0.5" size={16} fill="currentColor" />
                  </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(item.duration)}
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white truncate">{item.channelName}</h3>
                <p className="text-xs text-slate-400">{formatTimeAgo(item.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentlyWatched;