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
    if (shortcut.ctrlKey) parts.push('CTRL');
    if (shortcut.altKey) parts.push('ALT');
    if (shortcut.shiftKey) parts.push('SHIFT');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-background/40 backdrop-blur-[12px] z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass bg-[#020617] rounded-[3rem] border-white/10 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <Keyboard size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Keyboard Shortcuts</h2>
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
        <div className="p-8 overflow-y-auto scrollbar-hide">
          <div className="grid gap-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-5 glass-card border-white/5 hover:border-primary/20 transition-all hover:translate-x-1"
              >
                <div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest block mb-1">{shortcut.description}</span>
                  <span className="text-[9px] font-bold text-text-muted uppercase italic">Active Protocol</span>
                </div>
                <div className="flex gap-1.5">
                  {formatShortcut(shortcut).split(' + ').map((part, i) => (
                    <React.Fragment key={i}>
                      <kbd className="px-3 py-1.5 glass bg-white/5 border-white/10 text-primary text-[10px] font-black rounded-xl shadow-lg">
                        {part}
                      </kbd>
                      {i < formatShortcut(shortcut).split(' + ').length - 1 && (
                        <span className="text-text-muted self-center text-xs">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {shortcuts.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Keyboard size={40} className="text-text-muted opacity-20" />
              </div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">NO SHORTCUTS CONFIGURED</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/5 text-center">
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">PRO TIP</p>
          <p className="text-[10px] font-black text-white uppercase tracking-tight">USE THESE COMMANDS FOR LIGHTNING FAST NAVIGATION</p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;