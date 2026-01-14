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
        className={`p-2 rounded-lg transition-all ${
          isListening 
            ? 'bg-red-600 text-white animate-pulse' 
            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
        }`}
        title={isListening ? 'Stop listening' : 'Voice search'}
      >
        {isListening ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Mic size={18} />
        )}
      </button>

      {error && (
        <div className="absolute top-full right-0 mt-2 p-2 bg-red-600 text-white text-xs rounded-lg whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;