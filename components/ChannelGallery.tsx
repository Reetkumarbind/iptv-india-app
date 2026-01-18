
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IPTVChannel, WatchHistoryItem } from '../types';
import { StorageService } from '../services/storageService';
import { VoiceSearchService } from '../services/voiceSearchService';
import ChannelCard from './ChannelCard';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import RecentlyWatched from './RecentlyWatched';
import VoiceSearch from './VoiceSearch';
import {
  Search,
  Tv,
  X,
  ChevronDown,
  Newspaper,
  Trophy,
  Film,
  Music,
  Baby,
  LayoutGrid,
  SortAsc,
  Sparkles,
  Heart,
  Tags,
  FilterX,
  Plus,
  TrendingUp,
  Clock,
  Globe,
  Zap
} from 'lucide-react';

interface ChannelGalleryProps {
  channels: IPTVChannel[];
  favorites: Set<string>;
  onSelect: (index: number) => void;
  onToggleFavorite: (id: string) => void;
}

const CATEGORY_CONFIG: Record<string, { name: string, icon: React.ElementType }> = {
  'News': { name: 'News', icon: Newspaper },
  'Sports': { name: 'Sports', icon: Trophy },
  'Movies': { name: 'Movies', icon: Film },
  'Music': { name: 'Music', icon: Music },
  'Kids': { name: 'Kids', icon: Baby },
  'Entertainment': { name: 'Entertainment', icon: Sparkles },
  'General': { name: 'General TV', icon: Tv },
  'General Entertainment': { name: 'Entertainment', icon: Sparkles },
  'Other': { name: 'Other', icon: LayoutGrid },
};

type SortOrder = 'none' | 'name-asc' | 'name-desc' | 'group-asc' | 'group-desc' | 'trending' | 'recent';
type ViewMode = 'all' | 'favorites' | 'recent' | 'trending';

const ChannelGallery: React.FC<ChannelGalleryProps> = ({ channels, favorites, onSelect, onToggleFavorite }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [recentChannels, setRecentChannels] = useState<WatchHistoryItem[]>([]);
  const [trendingChannels, setTrendingChannels] = useState<string[]>([]);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  // Pagination State - Responsive based on screen size
  const getInitialCount = () => {
    return 120; // Default to 120 as requested
  };
  const [visibleCount, setVisibleCount] = useState(getInitialCount());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  // Load recent channels and trending data
  useEffect(() => {
    const recent = StorageService.getRecentlyWatched(10);
    setRecentChannels(recent);

    // Calculate trending based on recent watch frequency
    const channelCounts = recent.reduce((acc: any, item) => {
      acc[item.channelId] = (acc[item.channelId] || 0) + 1;
      return acc;
    }, {});

    const trending = Object.entries(channelCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 20)
      .map(([channelId]) => channelId);

    setTrendingChannels(trending);

    // Check voice search support
    const voiceService = new VoiceSearchService();
    setIsVoiceSupported(voiceService.isVoiceSearchSupported());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(getInitialCount());
  }, [searchTerm, selectedGroup, selectedLanguage, viewMode, sortOrder]);

  const groups = useMemo(() => {
    const rawGroups = new Set<string>();
    channels.forEach((c: any) => {
      const mapped = CATEGORY_CONFIG[c.group]?.name || c.group || 'Other';
      rawGroups.add(mapped);
    });

    return ['All', ...Array.from(rawGroups)].sort((a, b) => {
      if (a === 'All') return -1;
      return a.localeCompare(b);
    });
  }, [channels]);

  const languages = useMemo(() => {
    const rawLanguages = new Set<string>();
    channels.forEach((c: any) => {
      if (c.language) rawLanguages.add(c.language);
    });

    return ['All', ...Array.from(rawLanguages)].sort((a, b) => {
      if (a === 'All') return -1;
      return a.localeCompare(b);
    });
  }, [channels]);

  const handleSelectRecentChannel = (channelId: string) => {
    const channelIndex = channels.findIndex((c: any) => c.id === channelId);
    if (channelIndex >= 0) {
      onSelect(channelIndex);
    }
  };

  const handleVoiceSearchResult = (query: string) => {
    setSearchTerm(query);
  };

  const filteredChannels = useMemo(() => {
    let result = channels
      .map((channel: any, index: number) => ({ ...channel, originalIndex: index }))
      .filter((channel: any) => {
        const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesGroup = true;
        if (selectedGroup !== 'All') {
          const mapped = CATEGORY_CONFIG[channel.group]?.name || channel.group || 'Other';
          matchesGroup = mapped === selectedGroup;
        }

        let matchesLanguage = true;
        if (selectedLanguage !== 'All') {
          matchesLanguage = channel.language === selectedLanguage;
        }

        let matchesView = true;
        if (viewMode === 'favorites') {
          matchesView = favorites.has(channel.id);
        } else if (viewMode === 'recent') {
          matchesView = recentChannels.some(r => r.channelId === channel.id);
        } else if (viewMode === 'trending') {
          matchesView = trendingChannels.includes(channel.id);
        }

        return matchesSearch && matchesGroup && matchesLanguage && matchesView;
      });

    // Apply sorting
    if (sortOrder === 'name-asc') result.sort((a: any, b: any) => a.name.localeCompare(b.name));
    else if (sortOrder === 'name-desc') result.sort((a: any, b: any) => b.name.localeCompare(a.name));
    else if (sortOrder === 'group-asc') result.sort((a: any, b: any) => (a.group || '').localeCompare(b.group || ''));
    else if (sortOrder === 'group-desc') result.sort((a: any, b: any) => (b.group || '').localeCompare(a.group || ''));
    else if (sortOrder === 'trending') {
      result.sort((a: any, b: any) => {
        const aIndex = trendingChannels.indexOf(a.id);
        const bIndex = trendingChannels.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    } else if (sortOrder === 'recent') {
      result.sort((a: any, b: any) => {
        const aRecent = recentChannels.find(r => r.channelId === a.id);
        const bRecent = recentChannels.find(r => r.channelId === b.id);
        if (!aRecent && !bRecent) return 0;
        if (!aRecent) return 1;
        if (!bRecent) return -1;
        return bRecent.timestamp - aRecent.timestamp;
      });
    }

    return result;
  }, [channels, searchTerm, selectedGroup, selectedLanguage, favorites, sortOrder, viewMode, recentChannels, trendingChannels]);

  const visibleChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 60); // Load 60 more at a time
  };

  const resetFilters = () => {
    setSelectedGroup('All');
    setSelectedLanguage('All');
    setSearchTerm('');
    setSortOrder('none');
    setViewMode('all');
  };

  const cycleSort = () => {
    const cycle: Record<SortOrder, SortOrder> = {
      'none': 'name-asc',
      'name-asc': 'name-desc',
      'name-desc': 'group-asc',
      'group-asc': 'group-desc',
      'group-desc': 'trending',
      'trending': 'recent',
      'recent': 'none'
    };
    setSortOrder(cycle[sortOrder]);
  };

  const getSortLabel = () => {
    switch (sortOrder) {
      case 'name-asc': return 'A-Z';
      case 'name-desc': return 'Z-A';
      case 'group-asc': return 'Grp A-Z';
      case 'group-desc': return 'Grp Z-A';
      case 'trending': return 'Trending';
      case 'recent': return 'Recent';
      default: return 'Sort';
    }
  };

  const getCategoryIcon = (group: string) => {
    if (group === 'All') return LayoutGrid;
    return CATEGORY_CONFIG[group]?.icon || LayoutGrid;
  };

  const SelectedIcon = getCategoryIcon(selectedGroup);

  return (
    <div ref={scrollContainerRef} className="h-full w-full flex flex-col overflow-y-auto scrollbar-hide">
      <ScrollToTop containerRef={scrollContainerRef} />

      {/* Sticky Filters Container */}
      <div className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4 glass border-b border-white/5">
        <div className="max-w-[1920px] mx-auto flex flex-col gap-4">

          {/* Main Controls Overlay */}
          <div className="flex flex-wrap items-center justify-between gap-6">

            <div className="flex items-center gap-6 flex-1 min-w-0">
              {/* Unified Logo & Brand */}
              <div className="flex items-center gap-3 pr-6 border-r border-white/10 flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-premium rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Tv size={20} strokeWidth={2.5} />
                </div>
                <div className="hidden lg:block">
                  <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">
                    REET <span className="text-primary">TV</span>
                  </h1>
                </div>
              </div>

              {/* Prominent Search Bar */}
              <div className="flex-1 max-w-2xl relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search premium channels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full glass bg-white/5 border-white/5 rounded-2xl py-3 pl-12 pr-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <VoiceSearch onSearchResult={handleVoiceSearchResult} isSupported={isVoiceSupported} />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="text-text-muted hover:text-white p-1">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* View Modes Group */}
            <div className="flex p-1 glass rounded-2xl hidden md:flex">
              {[
                { id: 'all', icon: LayoutGrid, color: 'primary' },
                { id: 'favorites', icon: Heart, color: 'red-500' },
                { id: 'recent', icon: Clock, color: 'green-500' },
                { id: 'trending', icon: TrendingUp, color: 'purple-500' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as any)}
                  className={`px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${viewMode === mode.id
                    ? mode.id === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' :
                      mode.id === 'favorites' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                        mode.id === 'recent' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' :
                          'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'text-text-muted hover:text-white'
                    }`}
                >
                  <mode.icon size={14} fill={viewMode === mode.id && mode.id === 'favorites' ? 'currentColor' : 'none'} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline">{mode.id}</span>
                </button>
              ))}
            </div>

            {/* Sub-Filters */}
            <div className="flex items-center gap-3">
              {/* Category */}
              <div className="relative" ref={categoryRef}>
                <button
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="btn-premium px-4 py-3"
                >
                  <SelectedIcon size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                    {selectedGroup === 'All' ? 'Categories' : selectedGroup}
                  </span>
                  <ChevronDown size={14} className={`text-text-muted transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 glass rounded-2xl shadow-2xl py-2 z-[60] overflow-hidden animate-in fade-in zoom-in-95">
                    {groups.map((group) => {
                      const Icon = getCategoryIcon(group);
                      return (
                        <button
                          key={group}
                          onClick={() => { setSelectedGroup(group); setIsCategoryOpen(false); }}
                          className={`w-full px-5 py-3 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest transition-colors ${selectedGroup === group ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <Icon size={14} />
                          {group}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Languages */}
              <div className="relative" ref={languageRef}>
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="btn-premium px-4 py-3"
                >
                  <Globe size={14} className="text-secondary" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                    {selectedLanguage === 'All' ? 'Languages' : selectedLanguage}
                  </span>
                  <ChevronDown size={14} className={`text-text-muted transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLanguageOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 glass rounded-2xl shadow-2xl py-2 z-[60] overflow-hidden animate-in fade-in zoom-in-95">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => { setSelectedLanguage(lang); setIsLanguageOpen(false); }}
                        className={`w-full px-5 py-3 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest transition-colors ${selectedLanguage === lang ? 'bg-secondary/10 text-secondary' : 'text-text-muted hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <Globe size={14} />
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort */}
              <button onClick={cycleSort} className="btn-premium px-4 py-3">
                <SortAsc size={14} className="text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">{getSortLabel()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-premium py-12 pb-32">

        {/* Featured Card (Spotlight) */}
        {viewMode === 'all' && !searchTerm && selectedGroup === 'All' && (
          <div className="mb-16 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative glass-card bg-[#020617] p-8 sm:p-12 overflow-hidden flex flex-col lg:flex-row items-center gap-12">
              <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[100px] rounded-full translate-x-1/2"></div>

              <div className="flex-1 relative z-10 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6 animate-pulse">
                  <Sparkles size={14} /> Spotlight
                </div>
                <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter mb-6 leading-tight">
                  Experience <span className="text-gradient-premium">Infinity</span> TV
                </h2>
                <p className="text-text-muted text-sm sm:text-lg mb-8 max-w-xl font-medium tracking-wide leading-relaxed">
                  Stream your favorite content with unparalleled quality. Over {channels.length} channels at your fingertips.
                </p>
                <button
                  onClick={() => onSelect(Math.floor(Math.random() * channels.length))}
                  className="btn-premium-primary px-8 py-4 text-xs tracking-[0.3em]"
                >
                  START STREAMING
                </button>
              </div>

              <div className="w-full lg:w-1/3 relative aspect-video glass rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10 animate-float">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10"></div>
                {channels[0]?.logo && (
                  <img src={channels[0].logo} className="w-full h-full object-contain p-12" alt="" />
                )}
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                      <Zap size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-widest">4K ULTRA HD</div>
                      <div className="text-[8px] font-bold text-text-muted uppercase tracking-widest">ENABLED ON ALL STREAMS</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recently Watched */}
        {viewMode === 'all' && recentChannels.length > 0 && !searchTerm && (
          <div className="mb-12">
            <RecentlyWatched
              recentChannels={recentChannels}
              channels={channels}
              onSelectChannel={handleSelectRecentChannel}
            />
          </div>
        )}

        {/* Grid Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white tracking-widest flex items-center gap-3 italic">
              <span className="w-2 h-8 bg-primary rounded-full" />
              {viewMode === 'favorites' ? 'MY COLLECTION' : viewMode === 'recent' ? 'WATCH AGAIN' : 'ALL CHANNELS'}
            </h3>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mt-2">
              DISCOVERING {filteredChannels.length} PREMIUM STREAMS
            </p>
          </div>
          {(selectedGroup !== 'All' || selectedLanguage !== 'All' || searchTerm || viewMode !== 'all') && (
            <button onClick={resetFilters} className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-white transition-colors underline underline-offset-8">
              CLEAR FILTERS
            </button>
          )}
        </div>

        {/* Grid */}
        {filteredChannels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 sm:gap-8">
            {visibleChannels.map((channel) => (
              <ChannelCard
                key={channel.id + channel.originalIndex}
                channel={channel}
                isActive={false}
                isFavorite={favorites.has(channel.id)}
                onClick={() => onSelect(channel.originalIndex)}
                onToggleFavorite={() => onToggleFavorite(channel.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 glass rounded-[3rem] border-dashed border-2 border-white/5">
            <div className="w-24 h-24 rounded-3xl glass flex items-center justify-center mb-8">
              <Tv size={48} className="text-white/10" />
            </div>
            <h4 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-4">No Streams Found</h4>
            <p className="text-text-muted max-w-xs text-center text-sm font-medium leading-relaxed mb-8">
              We couldn't find any premium channels matching your current filters.
            </p>
            <button onClick={resetFilters} className="btn-premium-primary px-8 py-4 text-[10px] tracking-[0.2em]">
              RESET EXPLORER
            </button>
          </div>
        )}

        {/* Load More */}
        {visibleCount < filteredChannels.length && (
          <div className="mt-20 flex justify-center">
            <button
              onClick={handleLoadMore}
              className="group relative px-12 py-5 glass-card rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] text-white hover:border-primary/50 transition-all flex items-center gap-4"
            >
              <Plus size={16} className="text-primary group-hover:rotate-90 transition-transform duration-500" />
              LOAD MORE STREAMS
              <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-text-muted">
                {filteredChannels.length - visibleCount}
              </span>
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ChannelGallery;
