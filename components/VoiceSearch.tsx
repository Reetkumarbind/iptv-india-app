import React, { useState } from 'react';
import { VoiceSearchService } from '../services/voiceSearchService';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceSearchProps {
  onSearchResult: (query: string) => void;
  isSupported: boolean;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({ onSearchResult, isSupported }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voiceService = new VoiceSearchService();

  const handleVoiceSearch = async () => {
    if (!isSupported) return;

    setIsListening(true);
    setError(null);

    try {
      const result = await voiceService.startListening();
      onSearchResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Voice search failed');
    } finally {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  if (!isSupported) return null;

  return (
    <div className="relative">
      <button
        onClick={isListening ? stopListening : handleVoiceSearch}
        className={`p-3 rounded-2xl transition-all border-white/10 ${isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
            : 'glass text-text-muted hover:text-white hover:bg-white/10'
          }`}
        title={isListening ? 'Stop listening' : 'Voice Search'}
      >
        {isListening ? (
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-white animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-4 bg-white animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-3 bg-white animate-bounce" />
          </div>
        ) : (
          <Mic size={20} />
        )}
      </button>

      {error && (
        <div className="absolute top-full right-0 mt-3 p-3 glass bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap z-50 border-red-500/50 shadow-2xl">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;