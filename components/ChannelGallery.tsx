
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IPTVChannel } from '../types';
import ChannelCard from './ChannelCard';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
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
  Tags
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
    switch(sortOrder) {
      case 'name-asc': return 'A-Z';
      case 'name-desc': return 'Z-A';
      case 'group-asc': return 'Grp A-Z';
      case 'group-desc': return 'Grp Z-A';
      default: return 'Sort';
    }
  };

  const SelectedIcon = getCategoryIcon(selectedGroup);
  function getCategoryIcon(group: string) {
    if (group === 'All') return LayoutGrid;
    return CATEGORY_CONFIG[group]?.icon || LayoutGrid;
  }

  return (
    <div ref={scrollContainerRef} className="h-full w-full flex flex-col bg-slate-950 overflow-y-auto scroll-smooth">
      <ScrollToTop containerRef={scrollContainerRef} />
      
      {/* Hero Branding - Optimized for Mobile Padding */}
      <div className="relative pt-12 pb-6 px-6 flex flex-col items-center text-center flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
            <Tv size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400 uppercase leading-none">
            FREE TV CHANAL
          </h1>
        </div>
        <p className="text-slate-500 max-w-xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] opacity-80">
          Premium Streaming Interface
        </p>
      </div>

      {/* Mobbin-style Sticky Controls */}
      <div className="sticky top-0 z-50 px-4 sm:px-8 py-3 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5">
        <div className="w-full max-w-6xl mx-auto space-y-2">
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-slate-100 placeholder:text-slate-600"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Filter Actions - Horizontal Scroll on Mobile */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 -mx-2 px-2">
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-wider ${
                showOnlyFavorites 
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' 
                  : 'bg-slate-900/50 border border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heart size={14} fill={showOnlyFavorites ? "currentColor" : "none"} className={showOnlyFavorites ? "" : "text-amber-400/50"} />
              Saved
            </button>

            <div className="relative flex-shrink-0" ref={categoryRef}>
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center gap-2 bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-wider transition text-slate-200"
              >
                <SelectedIcon size={14} className="text-blue-500" />
                {selectedGroup === 'All' ? 'Categories' : selectedGroup}
                <ChevronDown size={12} className={`text-slate-500 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-[60] max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                  {groups.map((group) => {
                    const Icon = getCategoryIcon(group);
                    return (
                      <button
                        key={group}
                        onClick={() => {
                          setSelectedGroup(group);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full px-5 py-3 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-left transition-colors ${
                          selectedGroup === group ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-white/5'
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
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-wider ${
                sortOrder !== 'none' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900/50 border border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sortOrder.includes('group') ? <Tags size={14} /> : <SortAsc size={14} />}
              {getSortLabel()}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 pb-24 max-w-7xl mx-auto w-full mt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter">
              {showOnlyFavorites ? 'Your Collection' : 'Live Streams'}
            </h2>
            <div className="h-1 w-12 bg-blue-600 rounded-full mt-1" />
          </div>
          {(selectedGroup !== 'All' || searchTerm || sortOrder !== 'none' || showOnlyFavorites) && (
            <button 
              onClick={() => { 
                setSelectedGroup('All'); 
                setSearchTerm(''); 
                setSortOrder('none');
                setShowOnlyFavorites(false);
              }}
              className="text-[10px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10"
            >
              <X size={12} />
              Reset
            </button>
          )}
        </div>

        {filteredChannels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredChannels.map((channel) => (
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
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
              <Search size={32} className="opacity-10" />
            </div>
            <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight mb-2">Empty Library</h3>
            <p className="max-w-xs mx-auto text-slate-600 text-xs font-bold uppercase tracking-wider">
              {showOnlyFavorites 
                ? "No channels saved yet." 
                : "No matching results."}
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ChannelGallery;
