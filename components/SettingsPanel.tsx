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
          window.location.reload(); // Refresh to apply imported data
        } else {
          setImportError('Invalid backup file format');
        }
      } catch (error) {
        setImportError('Failed to import backup file');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const resetAllData = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Settings className="text-blue-500" size={20} />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="text-white" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              {preferences.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              Theme
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handlePreferenceChange('theme', 'dark')}
                className={`flex-1 p-3 rounded-xl border transition-all ${
                  preferences.theme === 'dark' 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-slate-800 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <Moon size={16} className="mx-auto mb-1" />
                <div className="text-xs font-bold">Dark</div>
              </button>
              <button
                onClick={() => handlePreferenceChange('theme', 'light')}
                className={`flex-1 p-3 rounded-xl border transition-all ${
                  preferences.theme === 'light' 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-slate-800 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <Sun size={16} className="mx-auto mb-1" />
                <div className="text-xs font-bold">Light</div>
              </button>
            </div>
          </div>

          {/* Playback */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Play size={16} />
              Playback
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Auto-play channels</span>
                <input
                  type="checkbox"
                  checked={preferences.autoPlay}
                  onChange={(e) => handlePreferenceChange('autoPlay', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500"
                />
              </label>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Default Quality</label>
                <select
                  value={preferences.defaultQuality}
                  onChange={(e) => handlePreferenceChange('defaultQuality', e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Keyboard size={16} />
              Controls
            </h3>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Keyboard shortcuts</span>
              <input
                type="checkbox"
                checked={preferences.keyboardShortcuts}
                onChange={(e) => handlePreferenceChange('keyboardShortcuts', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Analytics */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} />
              Analytics
            </h3>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Show bandwidth usage</span>
              <input
                type="checkbox"
                checked={preferences.showBandwidthUsage}
                onChange={(e) => handlePreferenceChange('showBandwidthUsage', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Data Management */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Data Management</h3>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-bold transition-colors"
              >
                <Download size={16} />
                Export Backup
              </button>
              
              <label className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-bold transition-colors cursor-pointer">
                <Upload size={16} />
                Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={resetAllData}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-bold transition-colors"
              >
                <RotateCcw size={16} />
                Reset All Data
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {exportSuccess && (
            <div className="p-3 bg-green-600/20 border border-green-600/30 rounded-lg text-green-400 text-sm text-center">
              Backup exported successfully!
            </div>
          )}
          
          {importError && (
            <div className="p-3 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 text-sm text-center">
              {importError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;