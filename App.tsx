
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IPTVChannel } from './types.ts';
import { fetchAndParseM3U } from './services/m3uParser.ts';
import ChannelGallery from './components/ChannelGallery.tsx';
import VideoPlayer from './components/VideoPlayer.tsx';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

const M3U_URL = 'https://iptv-org.github.io/iptv/countries/in.m3u';
const FAVORITES_KEY = 'iptv_favorites_v1';

type ViewMode = 'gallery' | 'player';

const App: React.FC = () => {
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        const savedFavorites = localStorage.getItem(FAVORITES_KEY);
        if (savedFavorites) {
          try { setFavorites(new Set(JSON.parse(savedFavorites))); } catch (e) { console.error("Failed to parse favorites", e); }
        }
        const data = await fetchAndParseM3U(M3U_URL);
        setChannels(data);
      } catch (err) {
        setError('Connection failed. Please check your internet.');
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = useCallback((channelId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (channels.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % channels.length);
  }, [channels.length]);

  const handlePrevious = useCallback(() => {
    if (channels.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + channels.length) % channels.length);
  }, [channels.length]);

  const handleSelectChannel = (index: number) => {
    setCurrentIndex(index);
    setViewMode('player');
  };

  const currentChannel = useMemo(() =>
    currentIndex >= 0 ? channels[currentIndex] : null
    , [channels, currentIndex]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
        <h2 className="text-xl font-black tracking-[0.2em] text-white uppercase">REET TV CHANNEL</h2>
        <p className="text-slate-400 mt-2 text-xs font-bold uppercase tracking-widest">Premium Stream Library</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">System Offline</h2>
        <p className="text-slate-500 mb-10 max-w-xs text-xs font-bold uppercase tracking-widest leading-loose">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-white text-slate-950 rounded-2xl transition font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95"
        >
          Retry Access
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      {viewMode === 'gallery' ? (
        <ChannelGallery
          channels={channels}
          favorites={favorites}
          onSelect={handleSelectChannel}
          onToggleFavorite={toggleFavorite}
        />
      ) : (
        <div className="h-full w-full flex flex-col relative bg-black">
          <button
            onClick={() => setViewMode('gallery')}
            className="absolute top-6 left-6 z-[100] flex items-center gap-2 pr-5 pl-3 py-3 bg-black/40 hover:bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 transition-all active:scale-90 group shadow-2xl"
          >
            <ChevronLeft size={20} className="text-white group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Exit Player</span>
          </button>

          <VideoPlayer
            channel={currentChannel}
            isFavorite={currentChannel ? favorites.has(currentChannel.id) : false}
            onToggleFavorite={currentChannel ? () => toggleFavorite(currentChannel.id) : () => { }}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        </div>
      )}
    </div>
  );
};

export default App;
