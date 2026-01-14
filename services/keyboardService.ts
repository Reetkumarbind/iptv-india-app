export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export class KeyboardService {
  private shortcuts: KeyboardShortcut[] = [];
  private isEnabled = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown, true); // Use capture phase
  }

  addShortcut(shortcut: KeyboardShortcut): void {
    // Remove existing shortcut with same key combination
    this.shortcuts = this.shortcuts.filter(s => 
      !(s.key === shortcut.key && 
        !!s.ctrlKey === !!shortcut.ctrlKey && 
        !!s.altKey === !!shortcut.altKey && 
        !!s.shiftKey === !!shortcut.shiftKey)
    );
    this.shortcuts.push(shortcut);
  }

  removeShortcut(key: string): void {
    this.shortcuts = this.shortcuts.filter(s => s.key !== key);
  }

  clearShortcuts(): void {
    this.shortcuts = [];
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  getShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Handle special keys
    let keyToMatch = event.key;
    
    // Normalize space key
    if (event.code === 'Space') {
      keyToMatch = ' ';
    }
    
    // Handle question mark (shift + /)
    if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      keyToMatch = '?';
    }

    const shortcut = this.shortcuts.find(s => 
      s.key === keyToMatch &&
      !!s.ctrlKey === event.ctrlKey &&
      !!s.altKey === event.altKey &&
      !!s.shiftKey === event.shiftKey
    );

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      try {
        shortcut.action();
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error);
      }
    }
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown, true);
    this.shortcuts = [];
  }
}