
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IPTVChannel } from '../types.ts';
import ChannelCard from './ChannelCard.tsx';
import Footer from './Footer.tsx';
import ScrollToTop from './ScrollToTop.tsx';
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
  Plus
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

type SortOrder = 'none' | 'name-asc' | 'name-desc' | 'group-asc' | 'group-desc';

const ChannelGallery: React.FC<ChannelGalleryProps> = ({ channels, favorites, onSelect, onToggleFavorite }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Pagination State
  const getInitialCount = () => (window.innerWidth < 640 ? 6 : 12);
  const [visibleCount, setVisibleCount] = useState(getInitialCount());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(getInitialCount());
  }, [searchTerm, selectedGroup, showOnlyFavorites, sortOrder]);

  const groups = useMemo(() => {
    const rawGroups = new Set<string>();
    channels.forEach(c => {
      const mapped = CATEGORY_CONFIG[c.group]?.name || c.group || 'Other';
      rawGroups.add(mapped);
    });

    return ['All', ...Array.from(rawGroups)].sort((a, b) => {
      if (a === 'All') return -1;
      return a.localeCompare(b);
    });
  }, [channels]);

  const filteredChannels = useMemo(() => {
    let result = channels
      .map((channel, index) => ({ ...channel, originalIndex: index }))
      .filter(channel => {
        const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
        let matchesGroup = true;
        if (selectedGroup !== 'All') {
          const mapped = CATEGORY_CONFIG[channel.group]?.name || channel.group || 'Other';
          matchesGroup = mapped === selectedGroup;
        }
        let matchesFavorite = true;
        if (showOnlyFavorites) {
          matchesFavorite = favorites.has(channel.id);
        }
        return matchesSearch && matchesGroup && matchesFavorite;
      });

    if (sortOrder === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOrder === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortOrder === 'group-asc') result.sort((a, b) => (a.group || '').localeCompare(b.group || ''));
    else if (sortOrder === 'group-desc') result.sort((a, b) => (b.group || '').localeCompare(a.group || ''));

    return result;
  }, [channels, searchTerm, selectedGroup, favorites, sortOrder, showOnlyFavorites]);

  const visibleChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + (window.innerWidth < 640 ? 12 : 24));
  };

  const resetFilters = () => {
    setSelectedGroup('All');
    setSearchTerm('');
    setSortOrder('none');
    setShowOnlyFavorites(false);
  };

  const cycleSort = () => {
    const cycle: Record<SortOrder, SortOrder> = {
      'none': 'name-asc',
      'name-asc': 'name-desc',
      'name-desc': 'group-asc',
      'group-asc': 'group-desc',
      'group-desc': 'none'
    };
    setSortOrder(cycle[sortOrder]);
  };

  const getSortLabel = () => {
    switch (sortOrder) {
      case 'name-asc': return 'A-Z';
      case 'name-desc': return 'Z-A';
      case 'group-asc': return 'Grp A-Z';
      case 'group-desc': return 'Grp Z-A';
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

      {/* Hero Branding - Compact Top Zero Center */}
      <div className="relative pt-4 pb-1 px-6 flex flex-col items-center text-center flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Tv size={18} strokeWidth={3} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400 uppercase leading-none">
            REET TV CHANNEL
          </h1>
        </div>
        <p className="text-slate-500 max-w-xl text-[10px] font-black uppercase tracking-[0.3em]">
          Premium Streaming Interface
        </p>
      </div>

      {/* Mobbin-style Sticky Controls */}
      <div className="sticky top-0 z-50 px-4 sm:px-8 py-2 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5">
        <div className="w-full max-w-6xl mx-auto space-y-4">

          {/* Main View Toggle - Prominent Tab Bar */}
          <div className="flex p-1 bg-slate-900/80 rounded-2xl border border-white/5 w-full sm:w-fit mx-auto">
            <button
              onClick={() => setShowOnlyFavorites(false)}
              className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${!showOnlyFavorites ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutGrid size={14} />
              All Channels
            </button>
            <button
              onClick={() => setShowOnlyFavorites(true)}
              className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${showOnlyFavorites ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Heart size={14} fill={showOnlyFavorites ? "currentColor" : "none"} />
              My Favorites
              {favorites.size > 0 && <span className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${showOnlyFavorites ? 'bg-red-400/30' : 'bg-slate-800'}`}>{favorites.size}</span>}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Bar */}
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Find a channel or stream..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-slate-100 placeholder:text-slate-500"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sub-Filters Container */}
            <div className="flex gap-2">
              <div className="relative flex-1 sm:flex-none sm:min-w-[160px]" ref={categoryRef}>
                <button
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full flex items-center justify-between gap-2 bg-slate-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-xs font-black uppercase tracking-wider transition text-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <SelectedIcon size={14} className="text-blue-500" />
                    {selectedGroup === 'All' ? 'Select Category' : selectedGroup}
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryOpen && (
                  <div className="absolute top-full right-0 sm:left-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-[60] max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {groups.map((group) => {
                      const Icon = getCategoryIcon(group);
                      return (
                        <button
                          key={group}
                          onClick={() => {
                            setSelectedGroup(group);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full px-5 py-3 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-left transition-colors ${selectedGroup === group ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-white/5'
                            }`}
                        >
                          <Icon size={16} className={selectedGroup === group ? 'text-blue-400' : 'text-slate-500'} />
                          {group}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={cycleSort}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3.5 rounded-xl transition-all duration-300 font-black text-xs uppercase tracking-wider ${sortOrder !== 'none' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900/50 border border-white/10 text-slate-400 hover:text-slate-100'
                  }`}
              >
                {sortOrder.includes('group') ? <Tags size={14} /> : <SortAsc size={14} />}
                {getSortLabel()}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 pb-24 max-w-7xl mx-auto w-full mt-2">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
          <div className="flex flex-col">
            <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              {showOnlyFavorites ? <Heart className="text-red-600" fill="currentColor" size={24} /> : <LayoutGrid className="text-blue-500" size={24} />}
              {showOnlyFavorites ? 'Saved Collection' : 'Channel Library'}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Currently showing {visibleCount < filteredChannels.length ? visibleCount : filteredChannels.length} of {filteredChannels.length} results
            </p>
          </div>
          {(selectedGroup !== 'All' || searchTerm || sortOrder !== 'none') && (
            <button
              onClick={resetFilters}
              className="text-[10px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10 active:scale-95 transition-transform"
            >
              <X size={12} />
              Reset filters
            </button>
          )}
        </div>

        {filteredChannels.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
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

            {/* Load More Button */}
            {visibleCount < filteredChannels.length && (
              <div className="mt-16 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="group relative flex items-center gap-3 px-10 py-5 bg-slate-900 border border-white/10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] text-white overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-600/10 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Plus size={16} className="text-blue-500 group-hover:rotate-90 transition-transform duration-500" />
                  Load More Channels
                  <span className="ml-2 px-2 py-1 bg-slate-800 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                    {filteredChannels.length - visibleCount} Left
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-inner">
                <FilterX size={48} className="text-slate-800" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                {showOnlyFavorites ? <Heart size={20} fill="currentColor" /> : <Search size={20} />}
              </div>
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
              {showOnlyFavorites ? 'No favorites yet' : 'No results found'}
            </h3>
            <p className="max-w-xs mx-auto text-slate-500 text-sm font-medium mb-10 leading-relaxed">
              {showOnlyFavorites
                ? "Browse our channel library and save your favorite streams for quick access."
                : "We couldn't find any channels matching your current search criteria."}
            </p>

            <button
              onClick={showOnlyFavorites ? () => setShowOnlyFavorites(false) : resetFilters}
              className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-3"
            >
              {showOnlyFavorites ? <LayoutGrid size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
              {showOnlyFavorites ? 'Browse Library' : 'Reset Search'}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ChannelGallery;
