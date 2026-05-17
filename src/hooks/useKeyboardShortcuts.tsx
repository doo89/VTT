/**
 * Keyboard Shortcuts System
 * 
 * Global keyboard shortcuts for GM view
 * Improves workflow efficiency during game sessions
 */

import { useEffect, useCallback, useRef } from 'react';

export interface Shortcut {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  callback: (e: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
}

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled: boolean = true) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcutsRef.current) {
      const { key, modifiers = {}, callback, preventDefault = true } = shortcut;

      // Check modifiers
      if (modifiers.ctrl && !e.ctrlKey) continue;
      if (modifiers.shift && !e.shiftKey) continue;
      if (modifiers.alt && !e.altKey) continue;
      if (modifiers.meta && !e.metaKey) continue;

      // Check key (case insensitive)
      if (e.key.toLowerCase() !== key.toLowerCase()) continue;

      // Match found
      if (preventDefault) {
        e.preventDefault();
      }
      callback(e);
      break;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Default GM shortcuts configuration
 */
export function useGMShortcuts(actions: {
  toggleLeftPanel?: () => void;
  toggleRightPanel?: () => void;
  nextCycle?: () => void;
  toggleNight?: () => void;
  startTimer?: () => void;
  pauseTimer?: () => void;
  resetTimer?: () => void;
  selectAllPlayers?: () => void;
  clearSelection?: () => void;
  toggleGrid?: () => void;
  resetView?: () => void;
  openSettings?: () => void;
  undo?: () => void;
  redo?: () => void;
  saveGame?: () => void;
  exportGame?: () => void;
}) {
  const shortcuts: Shortcut[] = [
    {
      key: '[',
      modifiers: { ctrl: true },
      callback: () => actions.toggleLeftPanel?.(),
      description: 'Toggle left panel',
    },
    {
      key: ']',
      modifiers: { ctrl: true },
      callback: () => actions.toggleRightPanel?.(),
      description: 'Toggle right panel',
    },
    {
      key: 'n',
      modifiers: { ctrl: true },
      callback: () => actions.nextCycle?.(),
      description: 'Next cycle',
    },
    {
      key: 'd',
      modifiers: { ctrl: true, shift: true },
      callback: () => actions.toggleNight?.(),
      description: 'Toggle day/night',
    },
    {
      key: ' ',
      callback: () => actions.startTimer?.(),
      description: 'Start/pause timer',
    },
    {
      key: 'r',
      modifiers: { ctrl: true },
      callback: () => actions.resetTimer?.(),
      description: 'Reset timer',
    },
    {
      key: 'a',
      modifiers: { ctrl: true },
      callback: () => actions.selectAllPlayers?.(),
      description: 'Select all players',
    },
    {
      key: 'Escape',
      callback: () => actions.clearSelection?.(),
      description: 'Clear selection',
    },
    {
      key: 'g',
      modifiers: { ctrl: true },
      callback: () => actions.toggleGrid?.(),
      description: 'Toggle grid',
    },
    {
      key: '0',
      modifiers: { ctrl: true },
      callback: () => actions.resetView?.(),
      description: 'Reset view',
    },
    {
      key: ',',
      modifiers: { ctrl: true },
      callback: () => actions.openSettings?.(),
      description: 'Open settings',
    },
    {
      key: 'z',
      modifiers: { ctrl: true },
      callback: () => actions.undo?.(),
      description: 'Undo',
    },
    {
      key: 'z',
      modifiers: { ctrl: true, shift: true },
      callback: () => actions.redo?.(),
      description: 'Redo',
    },
    {
      key: 's',
      modifiers: { ctrl: true },
      callback: () => actions.saveGame?.(),
      description: 'Save game',
    },
    {
      key: 'e',
      modifiers: { ctrl: true, shift: true },
      callback: () => actions.exportGame?.(),
      description: 'Export game',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

/**
 * Hook to show keyboard shortcuts help
 */
export function useKeyboardShortcutsHelp(shortcuts: Shortcut[]) {
  const getShortcutDisplay = (shortcut: Shortcut): string => {
    const parts: string[] = [];
    if (shortcut.modifiers?.ctrl) parts.push('Ctrl');
    if (shortcut.modifiers?.shift) parts.push('Shift');
    if (shortcut.modifiers?.alt) parts.push('Alt');
    if (shortcut.modifiers?.meta) parts.push('⌘');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return shortcuts
    .filter(s => s.description)
    .map(s => ({
      shortcut: getShortcutDisplay(s),
      description: s.description!,
    }));
}

/**
 * Keyboard Shortcuts Help Modal Component
 */
export function KeyboardShortcutsHelp({
  shortcuts,
  isOpen,
  onClose,
}: {
  shortcuts: Shortcut[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const helpItems = useKeyboardShortcutsHelp(shortcuts);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-2">
          {helpItems.map((item, i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <span className="text-sm text-muted-foreground">{item.description}</span>
              <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                {item.shortcut}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
