import React from 'react';
import { KeyboardShortcut } from '../services/keyboardService';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose, shortcuts }) => {
  if (!isOpen) return null;

  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Keyboard className="text-blue-500" size={20} />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Keyboard Shortcuts</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="text-white" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-300">{shortcut.description}</span>
                <kbd className="px-3 py-1 bg-slate-700 text-white text-xs font-mono rounded border border-slate-600">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>

          {shortcuts.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Keyboard size={48} className="mx-auto mb-4 opacity-50" />
              <p>No keyboard shortcuts available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;