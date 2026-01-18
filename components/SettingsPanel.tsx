import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { StorageService } from '../services/storageService';
import {
  Settings,
  X,
  Moon,
  Sun,
  Play,
  Keyboard,
  Activity,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  preferences,
  onPreferencesChange
}) => {
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    const updated = { ...preferences, [key]: value };
    onPreferencesChange(updated);
    StorageService.saveUserPreferences({ [key]: value });
  };

  const handleExport = () => {
    try {
      const data = StorageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reet-tv-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = StorageService.importData(content);
        if (success) {
          setImportError(null);
          window.location.reload();
        } else {
          setImportError('Invalid backup file format');
        }
      } catch (error) {
        setImportError('Failed to import backup file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const resetAllData = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/40 backdrop-blur-[12px] z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass bg-[#020617] rounded-[3rem] border-white/10 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">System Console</h2>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">CONFIGURE PERSONAL SESSION</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 glass rounded-2xl hover:bg-white/10 transition-colors border-white/10 text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-10 overflow-y-auto scrollbar-hide">
          {/* Theme Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Aesthetics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handlePreferenceChange('theme', 'dark')}
                className={`flex items-center gap-4 p-4 rounded-3xl transition-all ${preferences.theme === 'dark'
                    ? 'bg-primary text-white shadow-xl shadow-primary/20'
                    : 'glass text-text-muted hover:text-white border-white/5'
                  }`}
              >
                <Moon size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Midnight</span>
              </button>
              <button
                onClick={() => handlePreferenceChange('theme', 'light')}
                className={`flex items-center gap-4 p-4 rounded-3xl transition-all ${preferences.theme === 'light'
                    ? 'bg-primary text-white shadow-xl shadow-primary/20'
                    : 'glass text-text-muted hover:text-white border-white/5'
                  }`}
              >
                <Sun size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Daylight</span>
              </button>
            </div>
          </div>

          {/* Engine Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Stream Engine</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 glass rounded-3xl border-white/5">
                <div>
                  <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Auto-Initialization</div>
                  <div className="text-[9px] font-medium text-text-muted uppercase">START PLAYBACK IMMEDIATELY</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoPlay}
                  onChange={(e) => handlePreferenceChange('autoPlay', e.target.checked)}
                  className="w-5 h-5 rounded-lg border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-4 p-4 glass rounded-3xl border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Target Resolution</div>
                    <div className="text-[9px] font-medium text-text-muted uppercase">OPTIMIZE FOR YOUR CONNECTION</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['auto', '1080p', '720p', '480p'].map(q => (
                    <button
                      key={q}
                      onClick={() => handlePreferenceChange('defaultQuality', q)}
                      className={`py-2 text-[10px] font-black rounded-xl transition-all ${preferences.defaultQuality === q
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-white/5 text-text-muted hover:text-white'
                        }`}
                    >
                      {q.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Core Settings Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Interactions</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 glass rounded-3xl border-white/5">
                <div className="flex items-center gap-3">
                  <Keyboard size={18} className="text-secondary" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Shortcuts</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.keyboardShortcuts}
                  onChange={(e) => handlePreferenceChange('keyboardShortcuts', e.target.checked)}
                  className="w-5 h-5 rounded-lg border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
              </label>
              <label className="flex items-center justify-between p-4 glass rounded-3xl border-white/5">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-accent" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Bandwidth Telemetry</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.showBandwidthUsage}
                  onChange={(e) => handlePreferenceChange('showBandwidthUsage', e.target.checked)}
                  className="w-5 h-5 rounded-lg border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
              </label>
            </div>
          </div>

          {/* Data Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Data Management</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-3 p-4 glass rounded-3xl border-white/5 text-white hover:bg-white/5 transition-all"
              >
                <Download size={18} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
              </button>

              <label className="flex items-center justify-center gap-3 p-4 glass rounded-3xl border-white/5 text-white hover:bg-white/5 transition-all cursor-pointer">
                <Upload size={18} className="text-green-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Import</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            <button
              onClick={resetAllData}
              className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 hover:bg-red-500 hover:text-white transition-all group"
            >
              <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Purge All Data</span>
            </button>
          </div>

          {/* Feedback */}
          {(exportSuccess || importError) && (
            <div className={`p-4 rounded-3xl text-center text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 ${exportSuccess ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
              {exportSuccess ? 'BACKUP SEQUENCE COMPLETE' : importError?.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;