
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
    const width = window.innerWidth;
    if (width < 640) return 6;      // Mobile
    if (width < 1024) return 12;     // Tablet
    if (width < 1440) return 18;     // Desktop
    return 24;                       // Large Desktop/TV
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
    const width = window.innerWidth;
    const increment = width < 640 ? 12 : (width < 1024 ? 18 : 24);
    setVisibleCount(prev => prev + increment);
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
    <div ref={scrollContainerRef} className="h-full w-full flex flex-col bg-slate-950 overflow-y-auto scroll-smooth">
      <ScrollToTop containerRef={scrollContainerRef} />

      {/* Hero Branding - Responsive Top Zero Center */}
      <div className="relative pt-3 sm:pt-4 lg:pt-6 pb-1 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 sm:gap-3 mb-1">
          <div className="w-7 h-7 sm:w-8 sm:h-9 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Tv size={14} strokeWidth={3} />
          </div>
          <h1 className="text-sm sm:text-xl lg:text-2xl xl:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400 uppercase leading-none">
            REET TV CHANNEL
          </h1>
          <img
            src="/profile.png"
            alt="Reet Kumar Bind"
            className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full border border-blue-600/30 shadow-lg"
          />
        </div>
        <p className="text-slate-500 max-w-xs sm:max-w-md lg:max-w-xl text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em]">
          Premium Streaming Interface
        </p>
      </div>

      {/* Responsive Sticky Controls */}
      <div className="sticky top-0 z-50 px-3 sm:px-4 lg:px-8 py-2 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5">
        <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4">

          {/* Enhanced View Toggle - 4 modes */}
          <div className="flex p-1 bg-slate-900/80 rounded-xl sm:rounded-2xl border border-white/5 w-full sm:w-fit mx-auto">
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 touch-target ${viewMode === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutGrid size={12} />
              <span className="hidden xs:inline">All</span>
            </button>
            <button
              onClick={() => setViewMode('favorites')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 touch-target ${viewMode === 'favorites' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Heart size={12} fill={viewMode === 'favorites' ? "currentColor" : "none"} />
              <span className="hidden xs:inline">Fav</span>
              {favorites.size > 0 && <span className={`ml-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] ${viewMode === 'favorites' ? 'bg-red-400/30' : 'bg-slate-800'}`}>{favorites.size}</span>}
            </button>
            <button
              onClick={() => setViewMode('recent')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 touch-target ${viewMode === 'recent' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Clock size={12} />
              <span className="hidden xs:inline">Recent</span>
            </button>
            <button
              onClick={() => setViewMode('trending')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 touch-target ${viewMode === 'trending' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <TrendingUp size={12} />
              <span className="hidden xs:inline">Hot</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Enhanced Search Bar with Voice Search */}
            <div className="relative group flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={14} />
              <input
                type="text"
                placeholder="Find channel..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-3.5 pl-9 sm:pl-11 pr-16 sm:pr-20 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-slate-100 placeholder:text-slate-500"
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <VoiceSearch
                  onSearchResult={handleVoiceSearchResult}
                  isSupported={isVoiceSupported}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-white transition-colors p-1 touch-target">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Sub-Filters Container */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {/* Category Filter */}
              <div className="relative flex-1 sm:flex-none sm:min-w-[120px] lg:min-w-[140px]" ref={categoryRef}>
                <button
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full flex items-center justify-between gap-2 bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider transition text-slate-100 touch-target"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <SelectedIcon size={12} className="text-blue-500" />
                    <span className="truncate">
                      {selectedGroup === 'All' ? 'Category' : selectedGroup.length > 8 ? selectedGroup.substring(0, 6) + '...' : selectedGroup}
                    </span>
                  </div>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryOpen && (
                  <div className="absolute top-full right-0 sm:left-0 mt-2 w-48 sm:w-56 bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl py-2 z-[60] max-h-60 sm:max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {groups.map((group: any) => {
                      const Icon = getCategoryIcon(group);
                      return (
                        <button
                          key={group}
                          onClick={() => {
                            setSelectedGroup(group);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-left transition-colors touch-target ${selectedGroup === group ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-white/5'
                            }`}
                        >
                          <Icon size={12} className={selectedGroup === group ? 'text-blue-400' : 'text-slate-500'} />
                          <span className="truncate">{group}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Language Filter */}
              {languages.length > 2 && (
                <div className="relative flex-1 sm:flex-none sm:min-w-[100px] lg:min-w-[120px]" ref={languageRef}>
                  <button
                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                    className="w-full flex items-center justify-between gap-2 bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider transition text-slate-100 touch-target"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Globe size={12} className="text-green-500" />
                      <span className="truncate">
                        {selectedLanguage === 'All' ? 'Lang' : selectedLanguage.length > 6 ? selectedLanguage.substring(0, 4) + '...' : selectedLanguage}
                      </span>
                    </div>
                    <ChevronDown size={12} className={`text-slate-400 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isLanguageOpen && (
                    <div className="absolute top-full right-0 sm:left-0 mt-2 w-40 sm:w-48 bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl py-2 z-[60] max-h-60 sm:max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                      {languages.map((language: any) => (
                        <button
                          key={language}
                          onClick={() => {
                            setSelectedLanguage(language);
                            setIsLanguageOpen(false);
                          }}
                          className={`w-full px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-left transition-colors touch-target ${selectedLanguage === language ? 'bg-green-600/20 text-green-400' : 'text-slate-300 hover:bg-white/5'
                            }`}
                        >
                          <Globe size={12} className={selectedLanguage === language ? 'text-green-400' : 'text-slate-500'} />
                          <span className="truncate">{language}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Sort Button */}
              <button
                onClick={cycleSort}
                className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl transition-all duration-300 font-black text-[10px] sm:text-xs uppercase tracking-wider touch-target ${sortOrder !== 'none' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900/50 border border-white/10 text-slate-400 hover:text-slate-100'
                  }`}
              >
                {sortOrder.includes('group') ? <Tags size={12} /> :
                  sortOrder === 'trending' ? <TrendingUp size={12} /> :
                    sortOrder === 'recent' ? <Clock size={12} /> :
                      <SortAsc size={12} />}
                <span className="hidden sm:inline">{getSortLabel()}</span>
                <span className="sm:hidden">{sortOrder === 'none' ? 'Sort' : getSortLabel().substring(0, 3)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Channels Section */}
      {viewMode === 'all' && !searchTerm && selectedGroup === 'All' && selectedLanguage === 'All' && (
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-8 sm:mb-12">
          <div className="relative group overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 border border-white/10 aspect-[21/9] sm:aspect-[21/7] lg:aspect-[21/5] flex items-center p-6 sm:p-10 lg:p-16">
            <div className="absolute inset-0 bg-[#000814]/40 backdrop-blur-[2px]" />
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 sm:opacity-40">
              <div className="w-full h-full bg-blue-600 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="relative z-10 flex flex-col items-start max-w-2xl">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-full mb-4 sm:mb-6 animate-pulse">
                <Sparkles size={12} className="text-white" />
                <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Spotlight</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-[0.9]">
                Experience <span className="text-blue-500">Premium</span><br />
                Indian Television
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8 max-w-md uppercase tracking-wider leading-relaxed">
                Stream over {channels.length} high-quality channels directly on your device. Zero lag, crystal clear.
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => onSelect(Math.floor(Math.random() * channels.length))}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-105 transition active:scale-95"
                >
                  Watch Now
                </button>
                <div className="flex -space-x-3">
                  {channels.slice(0, 5).map((c, i) => (
                    <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-950 bg-slate-900 flex items-center justify-center overflow-hidden">
                      {c.logo ? <img src={c.logo} className="w-full h-full object-contain p-1" alt="" /> : <Tv size={12} className="text-slate-500" />}
                    </div>
                  ))}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-950 bg-blue-600 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white">
                    +{channels.length - 5}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Element */}
            <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 w-64 h-64 bg-slate-800/20 backdrop-blur-2xl rounded-[3rem] border border-white/5 rotate-12 transition-transform group-hover:rotate-6 duration-700">
              <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-4 -rotate-12 group-hover:-rotate-6 transition-transform duration-700">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40">
                  <Zap size={32} fill="white" className="text-white" />
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-white">4K ULTRA</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Adaptive Streaming</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recently Watched Section */}
      {viewMode === 'all' && recentChannels.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <RecentlyWatched
            recentChannels={recentChannels}
            channels={channels}
            onSelectChannel={handleSelectRecentChannel}
          />
        </div>
      )}

      {/* Main Content Area - Enhanced */}
      <div className="px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 max-w-7xl mx-auto w-full mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-white/5 pb-4">
          <div className="flex flex-col">
            <h2 className="text-base sm:text-lg lg:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2 sm:gap-3">
              {viewMode === 'favorites' ? <Heart className="text-red-600" fill="currentColor" size={16} /> :
                viewMode === 'recent' ? <Clock className="text-green-600" size={16} /> :
                  viewMode === 'trending' ? <TrendingUp className="text-purple-600" size={16} /> :
                    <LayoutGrid className="text-blue-500" size={16} />}
              {viewMode === 'favorites' ? 'Saved' :
                viewMode === 'recent' ? 'Recent' :
                  viewMode === 'trending' ? 'Trending' : 'Library'}
            </h2>
            <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              {visibleCount < filteredChannels.length ? visibleCount : filteredChannels.length} of {filteredChannels.length}
            </p>
          </div>
          {(selectedGroup !== 'All' || selectedLanguage !== 'All' || searchTerm || sortOrder !== 'none' || viewMode !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-[9px] sm:text-[10px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-500/5 border border-blue-500/10 active:scale-95 transition-transform touch-target"
            >
              <X size={10} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {filteredChannels.length > 0 ? (
          <>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
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

            {/* Load More Button - Responsive */}
            {visibleCount < filteredChannels.length && (
              <div className="mt-12 sm:mt-16 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="group relative flex items-center gap-2 sm:gap-3 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-slate-900 border border-white/10 rounded-xl sm:rounded-[2rem] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-600/10 active:scale-95 touch-target"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Plus size={12} className="text-blue-500 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="hidden xs:inline">Load More</span>
                  <span className="xs:hidden">More</span>
                  <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-slate-800 rounded-lg text-slate-400 group-hover:text-white transition-colors text-[8px] sm:text-[10px]">
                    {filteredChannels.length - visibleCount}
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32 px-4 sm:px-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-inner">
                <FilterX size={32} className="text-slate-800" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl">
                {viewMode === 'favorites' ? <Heart size={14} fill="currentColor" /> : <Search size={14} />}
              </div>
            </div>

            <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight mb-2 sm:mb-3">
              {viewMode === 'favorites' ? 'No favorites' :
                viewMode === 'recent' ? 'No recent channels' :
                  viewMode === 'trending' ? 'No trending channels' : 'No results'}
            </h3>
            <p className="max-w-xs mx-auto text-slate-500 text-xs sm:text-sm font-medium mb-6 sm:mb-10 leading-relaxed">
              {viewMode === 'favorites'
                ? "Browse channels and save favorites."
                : viewMode === 'recent'
                  ? "Start watching channels to see them here."
                  : viewMode === 'trending'
                    ? "Popular channels will appear here."
                    : "Try different search terms."}
            </p>

            <button
              onClick={viewMode !== 'all' ? () => setViewMode('all') : resetFilters}
              className="px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] shadow-2xl shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2 sm:gap-3 touch-target"
            >
              {viewMode !== 'all' ? <LayoutGrid size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
              {viewMode !== 'all' ? 'Browse All' : 'Reset'}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ChannelGallery;
