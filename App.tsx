
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IPTVChannel, UserPreferences } from './types';
import { fetchAndParseM3U } from './services/m3uParser';
import { StorageService } from './services/storageService';
import { KeyboardService } from './services/keyboardService';
import { SecurityService } from './services/securityService';
import ChannelGallery from './components/ChannelGallery';
import VideoPlayer from './components/VideoPlayer';
import SettingsPanel from './components/SettingsPanel';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import MiniPlayer from './components/MiniPlayer';
import SecurityIndicator from './components/SecurityIndicator';
import { Loader2, AlertCircle, ChevronLeft, Settings, Keyboard, Tv, RefreshCw } from 'lucide-react';

const M3U_URL = 'https://iptv-org.github.io/iptv/countries/in.m3u';

type ViewMode = 'gallery' | 'player' | 'mini';

const App: React.FC = () => {
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');

  // Enhanced features state
  const [preferences, setPreferences] = useState<UserPreferences>(StorageService.getUserPreferences());
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [keyboardService] = useState(() => new KeyboardService());
  const [miniPlayerPosition, setMiniPlayerPosition] = useState({ x: 20, y: 20 });
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize security service (optional for normal mode)
  useEffect(() => {
    try {
      console.log('🔒 Initializing security service...');
      // SecurityService.initialize(); // Disabled for normal mode
      console.log('✅ Security service skipped for normal mode');
    } catch (error) {
      console.error('❌ Security service initialization failed:', error);
      // Continue without security service if it fails
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🚀 Initializing app (Refresh:', refreshKey, ')...');

        // Load favorites
        const savedFavorites = StorageService.getFavorites();
        setFavorites(new Set(savedFavorites));

        console.log('📡 Fetching M3U playlist...');
        const data = await fetchAndParseM3U(M3U_URL);

        const validChannels = data.filter(channel =>
          channel.url && channel.name && channel.id
        );

        setChannels(validChannels);
        console.log('🎉 App initialized with', validChannels.length, 'channels');
      } catch (err) {
        console.error('❌ App initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Connection failed. Please check your internet.');
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Setup keyboard shortcuts
  useEffect(() => {
    if (!preferences.keyboardShortcuts) {
      keyboardService.setEnabled(false);
      return;
    }

    keyboardService.setEnabled(true);
    keyboardService.clearShortcuts();

    // Add keyboard shortcuts
    keyboardService.addShortcut({
      key: ' ',
      description: 'Play/Pause',
      action: () => {
        if (viewMode === 'player' || viewMode === 'mini') {
          const video = document.querySelector('video');
          if (video) {
            if (video.paused) {
              video.play().catch(console.error);
            } else {
              video.pause();
            }
          }
        }
      }
    });

    keyboardService.addShortcut({
      key: 'ArrowLeft',
      description: 'Previous Channel',
      action: () => {
        if (viewMode === 'player' && channels.length > 0) {
          setCurrentIndex((prev: number) => (prev - 1 + channels.length) % channels.length);
        }
      }
    });

    keyboardService.addShortcut({
      key: 'ArrowRight',
      description: 'Next Channel',
      action: () => {
        if (viewMode === 'player' && channels.length > 0) {
          setCurrentIndex((prev: number) => (prev + 1) % channels.length);
        }
      }
    });

    keyboardService.addShortcut({
      key: 'Escape',
      description: 'Back to Gallery',
      action: () => {
        setViewMode('gallery');
      }
    });

    keyboardService.addShortcut({
      key: 'f',
      description: 'Toggle Fullscreen',
      action: () => {
        if (viewMode === 'player') {
          const video = document.querySelector('video');
          if (video) {
            const event = new MouseEvent('dblclick', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            video.dispatchEvent(event);
          }
        }
      }
    });

    keyboardService.addShortcut({
      key: 'h',
      description: 'Toggle Favorite',
      action: () => {
        if (currentIndex >= 0 && channels[currentIndex]) {
          toggleFavorite(channels[currentIndex].id);
        }
      }
    });

    keyboardService.addShortcut({
      key: 'm',
      description: 'Toggle Mute',
      action: () => {
        const video = document.querySelector('video');
        if (video) {
          video.muted = !video.muted;
        }
      }
    });

    keyboardService.addShortcut({
      key: 's',
      description: 'Settings',
      action: () => {
        setShowSettings(true);
      }
    });

    keyboardService.addShortcut({
      key: '?',
      description: 'Show Shortcuts',
      action: () => {
        setShowKeyboardShortcuts(true);
      }
    });

    keyboardService.addShortcut({
      key: 'ArrowUp',
      description: 'Volume Up',
      action: () => {
        const video = document.querySelector('video');
        if (video) {
          video.volume = Math.min(1, video.volume + 0.1);
        }
      }
    });

    keyboardService.addShortcut({
      key: 'ArrowDown',
      description: 'Volume Down',
      action: () => {
        const video = document.querySelector('video');
        if (video) {
          video.volume = Math.max(0, video.volume - 0.1);
        }
      }
    });

    return () => keyboardService.clearShortcuts();
  }, [preferences.keyboardShortcuts, viewMode, currentIndex, channels]);

  // Cleanup on unmount and save data before leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save any current watch time before leaving
      if (currentIndex >= 0 && channels[currentIndex]) {
        StorageService.addToWatchHistory({
          channelId: channels[currentIndex].id,
          channelName: channels[currentIndex].name,
          timestamp: Date.now(),
          duration: 3, // Minimum duration for page unload
          logo: channels[currentIndex].logo || undefined
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      handleBeforeUnload(); // Save on component unmount
      keyboardService.destroy();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [keyboardService, currentIndex, channels]);

  useEffect(() => {
    // Save favorites using StorageService
    StorageService.saveFavorites(Array.from(favorites));
  }, [favorites]);

  // Handle preferences changes
  const handlePreferencesChange = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);

    // Apply theme
    if (newPreferences.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const toggleFavorite = useCallback((channelId: string) => {
    setFavorites((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (channels.length === 0) return;
    // Track current channel before switching
    if (currentIndex >= 0) {
      const currentChannel = channels[currentIndex];
      if (currentChannel) {
        StorageService.addToWatchHistory({
          channelId: currentChannel.id,
          channelName: currentChannel.name,
          timestamp: Date.now(),
          duration: 5, // Minimum duration for channel switching
          logo: currentChannel.logo || undefined
        });
      }
    }
    setCurrentIndex((prev: number) => (prev + 1) % channels.length);
  }, [channels.length, currentIndex, channels]);

  const handlePrevious = useCallback(() => {
    if (channels.length === 0) return;
    // Track current channel before switching
    if (currentIndex >= 0) {
      const currentChannel = channels[currentIndex];
      if (currentChannel) {
        StorageService.addToWatchHistory({
          channelId: currentChannel.id,
          channelName: currentChannel.name,
          timestamp: Date.now(),
          duration: 5, // Minimum duration for channel switching
          logo: currentChannel.logo || undefined
        });
      }
    }
    setCurrentIndex((prev: number) => (prev - 1 + channels.length) % channels.length);
  }, [channels.length, currentIndex, channels]);

  const handleSelectChannel = (index: number) => {
    // Track the selected channel immediately
    if (channels[index]) {
      StorageService.addToWatchHistory({
        channelId: channels[index].id,
        channelName: channels[index].name,
        timestamp: Date.now(),
        duration: 1, // Minimum duration for selection
        logo: channels[index].logo || undefined
      });
    }
    setCurrentIndex(index);
    setViewMode('player');
  };

  const handleMinimizePlayer = () => {
    setViewMode('mini');
  };

  const handleMaximizePlayer = () => {
    setViewMode('player');
  };

  const handleCloseMiniPlayer = () => {
    setViewMode('gallery');
  };

  const currentChannel = useMemo(() =>
    currentIndex >= 0 ? channels[currentIndex] : null
    , [channels, currentIndex]);

  const nextChannelName = useMemo(() => {
    if (channels.length === 0 || currentIndex < 0) return null;
    const nextIndex = (currentIndex + 1) % channels.length;
    return channels[nextIndex].name;
  }, [channels, currentIndex]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 blur-[100px] animate-pulse rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 blur-[100px] animate-pulse rounded-full" />

        <div className="relative flex flex-col items-center gap-8">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-500 animate-[spin_2s_linear_infinite]" strokeWidth={1} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Tv className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-[0.4em] text-white uppercase translate-y-2 opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-forwards">
              REET TV CHANNEL
            </h2>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-8 bg-blue-500/50" />
              <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">
                Premium Stream Library
              </p>
              <div className="h-[1px] w-8 bg-blue-500/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-4 sm:p-8 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 sm:mb-8">
          <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-500" />
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter mb-2">System Offline</h2>
        <p className="text-slate-500 mb-8 sm:mb-10 max-w-sm text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-loose">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-white text-slate-950 rounded-2xl transition font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95 touch-target"
        >
          Retry Access
        </button>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full overflow-hidden text-slate-100 selection:bg-blue-500/30 ${preferences.theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-950'}`}>
      {viewMode === 'gallery' ? (
        <ChannelGallery
          channels={channels}
          favorites={favorites}
          onSelect={handleSelectChannel}
          onToggleFavorite={toggleFavorite}
          onRefresh={handleRefresh}
        />
      ) : viewMode === 'player' ? (
        <div className="h-full w-full flex flex-col relative bg-black">
          <VideoPlayer
            channel={currentChannel}
            nextChannelName={nextChannelName || undefined}
            isFavorite={currentChannel ? favorites.has(currentChannel.id) : false}
            onToggleFavorite={currentChannel ? () => toggleFavorite(currentChannel.id) : () => { }}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onMinimize={handleMinimizePlayer}
            onExit={() => setViewMode('gallery')}
            onShowKeyboard={() => setShowKeyboardShortcuts(true)}
          />
        </div>
      ) : null}

      {/* Mini Player */}
      <MiniPlayer
        channel={currentChannel}
        isVisible={viewMode === 'mini'}
        onClose={handleCloseMiniPlayer}
        onMaximize={handleMaximizePlayer}
        position={miniPlayerPosition}
        onPositionChange={setMiniPlayerPosition}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onPreferencesChange={handlePreferencesChange}
      />


      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        shortcuts={keyboardService.getShortcuts()}
      />
    </div>
  );
};

export default App;
