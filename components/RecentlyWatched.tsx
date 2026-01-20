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
              className="group flex-shrink-0 w-56 cursor-pointer"
            >
              <div className="relative aspect-video glass-card overflow-hidden mb-3 border-white/5 hover:scale-[1.05] transition-all duration-500 shadow-xl hover:shadow-primary/20">
                {item.logo ? (
                  <div className="w-full h-full bg-cyan-400 flex items-center justify-center p-6">
                    <img
                      src={item.logo}
                      alt={item.channelName}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cyan-400">
                    <Play className="text-white/20" size={32} />
                  </div>
                )}

                {/* Premium Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl">
                    <Play className="text-slate-950 ml-1" size={20} fill="currentColor" />
                  </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[8px] font-black text-white border border-white/10 tracking-widest">
                  {formatDuration(item.duration)}
                </div>
              </div>

              <div className="px-1">
                <h3 className="text-[11px] font-bold text-white truncate uppercase tracking-wide group-hover:text-primary transition-colors">{item.channelName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">{formatTimeAgo(item.timestamp)}</span>
                  <span className="w-1 h-1 bg-white/10 rounded-full" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{channel.group || 'GENERAL'}</span>
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