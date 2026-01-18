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

    if (days > 0) return `${days}D AGO`;
    if (hours > 0) return `${hours}H AGO`;
    if (minutes > 0) return `${minutes}M AGO`;
    return 'JUST NOW';
  };

  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-16">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-primary">
          <Clock size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Continue Watching</h2>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">YOUR RECENT ACTIVITY</p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {recentChannels.slice(0, 10).map((item) => {
          const channel = channels.find(c => c.id === item.channelId);
          if (!channel) return null;

          return (
            <div
              key={item.channelId + item.timestamp}
              onClick={() => onSelectChannel(item.channelId)}
              className="group flex-shrink-0 w-48 cursor-pointer"
            >
              <div className="relative aspect-video glass-card overflow-hidden mb-4 border-white/5 hover:scale-105 transition-all">
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={item.channelName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="text-white/10" size={32} />
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl">
                    <Play className="text-primary ml-1" size={20} fill="currentColor" />
                  </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 glass px-2 py-1 rounded-lg text-[10px] font-bold text-white border-white/10">
                  {formatDuration(item.duration)}
                </div>
              </div>

              <div className="px-1">
                <h3 className="text-xs font-black text-white truncate uppercase tracking-tight mb-1">{item.channelName}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">{formatTimeAgo(item.timestamp)}</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full" />
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{channel.group || 'GENERAL'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentlyWatched;